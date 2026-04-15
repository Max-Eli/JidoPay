import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { authenticateApiKey } from "@/lib/api-auth";
import { calculateApplicationFee, generateId } from "@/lib/utils";
import { db, auditLogs } from "@/lib/db";

// POST /api/v1/checkout — dynamic multi-line-item checkout
//
// Creates a one-time Stripe Payment Link on the merchant's connected account
// with arbitrary line items supplied by the caller. Lets merchants bundle any
// combination of products (cart checkout, custom invoicing flows, upsells)
// into a single Stripe session without pre-creating a payment link for every
// combo from the dashboard.
//
// Auth: Bearer token (merchant API key from /settings/api-keys).
//
// Why a Payment Link and not a Checkout Session?
//   Payment Links (buy.stripe.com) can be iframed inside our embed modal so
//   merchants get a consistent JidoPay-branded experience. Stripe's hosted
//   Checkout Sessions (checkout.stripe.com) set X-Frame-Options: DENY, which
//   would force us to pop a new tab and break the embed UX.

export const runtime = "nodejs";

const lineItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  // Amount in the smallest currency unit (cents for USD). Must be a positive
  // integer; fractional cents are always a bug.
  amount: z.number().int().min(50),
  currency: z.string().length(3).default("usd"),
  quantity: z.number().int().min(1).max(100).default(1),
});

const bodySchema = z.object({
  line_items: z.array(lineItemSchema).min(1).max(20),
  customer_email: z.string().email().optional(),
  client_reference_id: z.string().max(200).optional(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  // Arbitrary merchant-supplied metadata, echoed back on webhooks. Useful
  // for carrying things like cart id, cohort selection, coupon code, etc.
  metadata: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  const { merchant } = authResult;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const data = parsed.data;

  // All line items must share a currency since Stripe Payment Links only
  // support a single currency per link. Catch this early with a clear error.
  const currencies = new Set(data.line_items.map((i) => i.currency));
  if (currencies.size > 1) {
    return NextResponse.json(
      { error: "All line items must share the same currency" },
      { status: 422 }
    );
  }
  const currency = data.line_items[0].currency;

  const checkoutId = generateId("co");

  try {
    // Create one Stripe Price per line item. Using product_data lets us
    // inline the product and avoid pre-creating Stripe Product objects —
    // each call is idempotent via stable idempotency keys so retries don't
    // duplicate.
    const stripeLineItems: { price: string; quantity: number }[] = [];
    let grossTotal = 0;

    for (let i = 0; i < data.line_items.length; i++) {
      const item = data.line_items[i];
      const price = await stripe.prices.create(
        {
          currency: item.currency,
          unit_amount: item.amount,
          product_data: {
            name: item.name,
            ...(item.description ? { metadata: { description: item.description } } : {}),
          },
        },
        {
          stripeAccount: merchant.stripeAccountId,
          idempotencyKey: `${checkoutId}_price_${i}`,
        }
      );
      stripeLineItems.push({ price: price.id, quantity: item.quantity });
      grossTotal += item.amount * item.quantity;
    }

    // Application fee is computed on the gross total, not per line item,
    // so the merchant is charged JidoPay's flat 0.6% once (same math the
    // existing /api/payment-links endpoint uses).
    const applicationFee = calculateApplicationFee(grossTotal);

    // Stringify the caller-supplied metadata plus our own housekeeping keys
    // so the webhook can identify this session as dynamic and find the
    // right merchant record on the inbound side.
    const stripeMetadata: Record<string, string> = {
      ...(data.metadata ?? {}),
      merchantId: merchant.id,
      jidopayCheckoutId: checkoutId,
      jidopayEphemeral: "1",
      ...(data.client_reference_id
        ? { clientReferenceId: data.client_reference_id }
        : {}),
    };

    const paymentLink = await stripe.paymentLinks.create(
      {
        line_items: stripeLineItems,
        application_fee_amount: applicationFee,
        metadata: stripeMetadata,
        ...(data.customer_email
          ? {
              // Prefill customer email so the shopper doesn't have to retype
              // what their merchant already knows.
              customer_creation: "always" as const,
            }
          : {}),
        after_completion: data.success_url
          ? {
              type: "redirect" as const,
              redirect: { url: data.success_url },
            }
          : {
              type: "redirect" as const,
              redirect: {
                url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/success`,
              },
            },
      },
      {
        stripeAccount: merchant.stripeAccountId,
        idempotencyKey: `${checkoutId}_link`,
      }
    );

    // Stripe Payment Links don't accept customer_email as a prefill directly,
    // so we tack the prefilled_email query param onto the URL — Stripe's
    // hosted page reads it and fills the email field on load.
    let url = paymentLink.url;
    if (data.customer_email) {
      const u = new URL(url);
      u.searchParams.set("prefilled_email", data.customer_email);
      url = u.toString();
    }
    if (data.client_reference_id) {
      const u = new URL(url);
      u.searchParams.set("client_reference_id", data.client_reference_id);
      url = u.toString();
    }

    await db.insert(auditLogs).values({
      id: generateId("aud"),
      merchantId: merchant.id,
      action: "payment_link_created",
      resourceId: checkoutId,
      resourceType: "dynamic_checkout",
      metadata: JSON.stringify({
        lineItemCount: data.line_items.length,
        grossTotal,
        currency,
        apiKeyId: merchant.apiKeyId,
      }),
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    });

    return NextResponse.json(
      {
        id: checkoutId,
        url,
        stripe_payment_link_id: paymentLink.id,
        amount_total: grossTotal,
        currency,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[v1/checkout] create failed", err);
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json(
      { error: "Stripe create failed", message },
      { status: 502 }
    );
  }
}
