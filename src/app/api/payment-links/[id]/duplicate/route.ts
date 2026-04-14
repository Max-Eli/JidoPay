import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, paymentLinks, merchants, auditLogs } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { generateId, calculateApplicationFee } from "@/lib/utils";
import { getRatelimit } from "@/lib/ratelimit";

const duplicateSchema = z.object({
  // Optional overrides — if omitted, clone exactly.
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  amount: z.number().int().min(50).optional(),
  archiveOriginal: z.boolean().default(true),
});

/**
 * Create a new payment link that's a clone of an existing one, optionally
 * with a different amount. Stripe payment links are immutable on price —
 * this is the clean way to "edit price": clone with the new amount, then
 * archive the original so the old URL can still handle in-flight checkouts
 * but new customers are routed to the new link.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = getRatelimit();
  const { success } = await rl.limit(userId);
  if (!success)
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = duplicateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const [source] = await db
    .select()
    .from(paymentLinks)
    .where(
      and(eq(paymentLinks.id, id), eq(paymentLinks.merchantId, userId))
    );

  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant?.stripeAccountId || !merchant.stripeChargesEnabled) {
    return NextResponse.json(
      { error: "Payout account not ready" },
      { status: 400 }
    );
  }

  const newLinkId = generateId("lnk");
  const amount = parsed.data.amount ?? source.amount;
  const name = parsed.data.name ?? source.name;
  const description =
    parsed.data.description !== undefined
      ? parsed.data.description
      : source.description;
  const isRecurring = source.type === "recurring";
  const appFee = calculateApplicationFee(amount);

  const price = await stripe.prices.create(
    {
      currency: source.currency,
      unit_amount: amount,
      product_data: { name },
      ...(isRecurring
        ? {
            recurring: {
              interval: source.interval!,
              interval_count: source.intervalCount!,
            },
          }
        : {}),
    },
    {
      stripeAccount: merchant.stripeAccountId,
      idempotencyKey: `price_${newLinkId}`,
    }
  );

  const oneClickExtras =
    merchant.oneClickPayEnabled && !isRecurring
      ? {
          customer_creation: "always" as const,
          payment_intent_data: {
            setup_future_usage: "off_session" as const,
          },
        }
      : {};

  const stripePaymentLink = await stripe.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      ...(isRecurring
        ? { application_fee_percent: 0.6 }
        : { application_fee_amount: appFee }),
      metadata: {
        merchantId: userId,
        paymentLinkId: newLinkId,
        duplicatedFrom: source.id,
      },
      ...oneClickExtras,
      after_completion: {
        type: "redirect",
        redirect: { url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/success` },
      },
    },
    {
      stripeAccount: merchant.stripeAccountId,
      idempotencyKey: `paylink_${newLinkId}`,
    }
  );

  const [link] = await db
    .insert(paymentLinks)
    .values({
      id: newLinkId,
      merchantId: userId,
      name,
      description: description ?? null,
      amount,
      currency: source.currency,
      status: "active",
      type: source.type,
      interval: source.interval,
      intervalCount: source.intervalCount,
      stripePaymentLinkId: stripePaymentLink.id,
      stripePaymentLinkUrl: stripePaymentLink.url,
    })
    .returning();

  if (parsed.data.archiveOriginal && source.stripePaymentLinkId) {
    try {
      await stripe.paymentLinks.update(
        source.stripePaymentLinkId,
        { active: false },
        { stripeAccount: merchant.stripeAccountId }
      );
      await db
        .update(paymentLinks)
        .set({ status: "inactive", updatedAt: new Date() })
        .where(eq(paymentLinks.id, source.id));
      await db.insert(auditLogs).values({
        id: generateId("aud"),
        merchantId: userId,
        action: "payment_link_deactivated",
        resourceId: source.id,
        resourceType: "payment_link",
        metadata: JSON.stringify({ reason: "replaced_by", newId: newLinkId }),
        ipAddress: null,
      });
    } catch (err) {
      console.error(
        "[payment-links] failed to archive original after duplicate",
        err
      );
      // Don't fail the whole request — the new link is live and usable.
    }
  }

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "payment_link_created",
    resourceId: newLinkId,
    resourceType: "payment_link",
    metadata: JSON.stringify({
      name,
      amount,
      duplicatedFrom: source.id,
    }),
    ipAddress:
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      null,
  });

  return NextResponse.json({ link }, { status: 201 });
}
