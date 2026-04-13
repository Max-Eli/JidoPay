import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, paymentLinks, merchants, auditLogs } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateId, calculateApplicationFee } from "@/lib/utils";
import { stripe } from "@/lib/stripe";
import { getRatelimit } from "@/lib/ratelimit";

const createPaymentLinkSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  amount: z.number().int().min(50), // cents, minimum 50 cents
  currency: z.string().length(3).default("usd"),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = getRatelimit();
  const { success } = await rl.limit(userId);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant?.stripeAccountId || !merchant.stripeChargesEnabled) {
    return NextResponse.json(
      { error: "Stripe account not connected or charges not enabled" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createPaymentLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const linkId = generateId("lnk");
  const appFee = calculateApplicationFee(data.amount);

  // Create Stripe price + payment link on the connected account
  const price = await stripe.prices.create(
    {
      currency: data.currency,
      unit_amount: data.amount,
      product_data: { name: data.name },
    },
    { stripeAccount: merchant.stripeAccountId }
  );

  const stripePaymentLink = await stripe.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      application_fee_amount: appFee,
      metadata: {
        merchantId: userId,
        paymentLinkId: linkId,
      },
      // One-click pay: create a persistent Customer so returning buyers
      // can reuse their saved details on the next visit.
      ...(merchant.oneClickPayEnabled
        ? {
            customer_creation: "always" as const,
            payment_intent_data: {
              setup_future_usage: "off_session" as const,
            },
          }
        : {}),
      after_completion: {
        type: "redirect",
        redirect: { url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/success` },
      },
    },
    { stripeAccount: merchant.stripeAccountId }
  );

  const [link] = await db
    .insert(paymentLinks)
    .values({
      id: linkId,
      merchantId: userId,
      name: data.name,
      description: data.description ?? null,
      amount: data.amount,
      currency: data.currency,
      status: "active",
      stripePaymentLinkId: stripePaymentLink.id,
      stripePaymentLinkUrl: stripePaymentLink.url,
    })
    .returning();

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "payment_link_created",
    resourceId: linkId,
    resourceType: "payment_link",
    metadata: JSON.stringify({ name: data.name, amount: data.amount }),
    ipAddress: req.headers.get("x-forwarded-for") ?? null,
  });

  return NextResponse.json({ link }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await db
    .select()
    .from(paymentLinks)
    .where(eq(paymentLinks.merchantId, userId));

  return NextResponse.json({ links });
}
