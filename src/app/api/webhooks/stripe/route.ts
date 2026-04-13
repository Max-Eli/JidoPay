import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { stripe } from "@/lib/stripe";
import {
  db,
  merchants,
  payments,
  invoices,
  webhookEvents,
  paymentLinks,
  abandonedCheckouts,
} from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateId, calculateApplicationFee } from "@/lib/utils";
import type Stripe from "stripe";

// Stripe sends raw body — disable Next.js body parsing
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Idempotency check ────────────────────────────────────────────────────
  const [existing] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.id, event.id));

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record event immediately to prevent duplicate processing
  await db.insert(webhookEvents).values({ id: event.id, type: event.type });

  // event.account is present when the event originates from a connected account
  const connectedAccountId = (event as Stripe.Event & { account?: string }).account ?? null;

  // ── Handle events ────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        await handlePaymentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          connectedAccountId
        );
        break;
      }
      case "payment_intent.payment_failed": {
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }
      case "account.updated": {
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      }
      case "payment_link.created":
      case "payment_link.updated": {
        // Handled via API, no action needed
        break;
      }
      case "checkout.session.expired": {
        await handleCheckoutExpired(
          event.data.object as Stripe.Checkout.Session,
          connectedAccountId
        );
        break;
      }
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }
      default:
        // Unhandled event types are fine — we just record them
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry — log the error for monitoring
    // In production, send to error tracking (Sentry, etc.)
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(
  pi: Stripe.PaymentIntent,
  connectedAccountId: string | null
) {
  // merchantId comes from metadata (set when creating the payment intent)
  // connectedAccountId is the fallback — look up merchant by their Stripe account ID
  let merchantId = pi.metadata?.merchantId ?? null;

  if (!merchantId && connectedAccountId) {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.stripeAccountId, connectedAccountId));
    merchantId = merchant?.id ?? null;
  }

  if (!merchantId) return;

  const appFee = pi.application_fee_amount ?? calculateApplicationFee(pi.amount);

  // Check if payment already recorded
  const [existing] = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, pi.id));

  if (existing) {
    await db
      .update(payments)
      .set({ status: "succeeded", updatedAt: new Date() })
      .where(eq(payments.stripePaymentIntentId, pi.id));
  } else {
    await db.insert(payments).values({
      id: generateId("pay"),
      merchantId,
      stripePaymentIntentId: pi.id,
      amount: pi.amount,
      applicationFee: appFee,
      currency: pi.currency,
      status: "succeeded",
      customerName: pi.metadata?.customerName ?? null,
      customerEmail: pi.metadata?.customerEmail ?? null,
      description: pi.description ?? null,
      invoiceId: pi.metadata?.invoiceId ?? null,
      paymentLinkId: pi.metadata?.paymentLinkId ?? null,
    });
  }

  // If this payment is for an invoice, mark it paid
  if (pi.metadata?.invoiceId) {
    await db
      .update(invoices)
      .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(invoices.id, pi.metadata.invoiceId));
  }

  // Update payment link stats
  if (pi.metadata?.paymentLinkId) {
    const [link] = await db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.id, pi.metadata.paymentLinkId));

    if (link) {
      await db
        .update(paymentLinks)
        .set({
          totalCollected: link.totalCollected + pi.amount,
          useCount: link.useCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(paymentLinks.id, pi.metadata.paymentLinkId));
    }
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  await db
    .update(payments)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(payments.stripePaymentIntentId, pi.id));
}

async function handleCheckoutExpired(
  session: Stripe.Checkout.Session,
  connectedAccountId: string | null
) {
  let merchantId = (session.metadata?.merchantId as string | undefined) ?? null;
  if (!merchantId && connectedAccountId) {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.stripeAccountId, connectedAccountId));
    merchantId = merchant?.id ?? null;
  }
  if (!merchantId) return;

  const paymentLinkId =
    (session.metadata?.paymentLinkId as string | undefined) ?? null;

  await db
    .insert(abandonedCheckouts)
    .values({
      id: generateId("abn"),
      merchantId,
      paymentLinkId,
      stripeSessionId: session.id,
      customerEmail: session.customer_details?.email ?? null,
      customerPhone: session.customer_details?.phone ?? null,
      customerName: session.customer_details?.name ?? null,
      amount: session.amount_total ?? 0,
      currency: (session.currency ?? "usd").toLowerCase(),
      status: "pending",
    })
    .onConflictDoNothing();
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // If this session previously existed as an abandoned checkout, mark it recovered
  if (!session.id) return;
  await db
    .update(abandonedCheckouts)
    .set({ status: "recovered", recoveredAt: new Date() })
    .where(eq(abandonedCheckouts.stripeSessionId, session.id));
}

async function handleAccountUpdated(account: Stripe.Account) {
  // Find merchant by stripe account id
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.stripeAccountId, account.id));

  if (!merchant) return;

  await db
    .update(merchants)
    .set({
      stripeChargesEnabled: account.charges_enabled ?? false,
      stripePayoutsEnabled: account.payouts_enabled ?? false,
      stripeOnboardingComplete:
        (account.charges_enabled && account.payouts_enabled) ?? false,
      updatedAt: new Date(),
    })
    .where(eq(merchants.stripeAccountId, account.id));
}

