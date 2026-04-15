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
  auditLogs,
  customers,
  savedPaymentMethods,
} from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { generateId, calculateApplicationFee } from "@/lib/utils";
import { dispatchMerchantWebhook } from "@/lib/merchant-webhooks";
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
  // Only treat an event as already-processed if there's a webhook_events row
  // AND processing actually completed last time. We mark the row with
  // processedAt = NULL while a handler is in flight so a crash before
  // completion allows Stripe's retry to re-enter the handler.
  const [existing] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.id, event.id));

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // event.account is present when the event originates from a connected account
  const connectedAccountId = (event as Stripe.Event & { account?: string }).account ?? null;

  // ── Handle events ────────────────────────────────────────────────────────
  // If a handler throws (DB blip, connection error, etc.) we return 5xx so
  // Stripe retries. The webhook_events row is only written *after* the
  // handler succeeds, so retries will re-enter cleanly.
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
          event.data.object as Stripe.Checkout.Session,
          connectedAccountId
        );
        break;
      }
      case "charge.refunded": {
        await handleChargeRefunded(
          event.data.object as Stripe.Charge,
          connectedAccountId
        );
        break;
      }
      default:
        // Unhandled event types are fine — we just record them
        break;
    }

    // Only mark the event processed once the handler succeeds.
    // onConflictDoNothing guards against a narrow race where two retries
    // from Stripe arrive simultaneously.
    await db
      .insert(webhookEvents)
      .values({ id: event.id, type: event.type })
      .onConflictDoNothing();
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    // Return 5xx so Stripe retries. Do NOT mark the event processed.
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
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

    await db.insert(auditLogs).values({
      id: generateId("aud"),
      merchantId,
      action: "invoice_paid",
      resourceId: pi.metadata.invoiceId,
      resourceType: "invoice",
      metadata: JSON.stringify({
        amount: pi.amount,
        stripePaymentIntentId: pi.id,
      }),
      ipAddress: null,
    });
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

  // Fan-out to merchant-facing outbound webhooks. Failures here must not
  // roll back the Stripe webhook — merchants with broken endpoints should
  // not block internal bookkeeping, so we swallow and log.
  try {
    await dispatchMerchantWebhook({
      merchantId,
      event: "payment.succeeded",
      data: {
        paymentIntentId: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        applicationFee: appFee,
        paymentLinkId: pi.metadata?.paymentLinkId ?? null,
        invoiceId: pi.metadata?.invoiceId ?? null,
        customerEmail: pi.metadata?.customerEmail ?? null,
        customerName: pi.metadata?.customerName ?? null,
        metadata: pi.metadata ?? {},
        description: pi.description ?? null,
      },
    });
  } catch (err) {
    console.error("[webhook] dispatch payment.succeeded failed", err);
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  await db
    .update(payments)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(payments.stripePaymentIntentId, pi.id));

  const merchantId = pi.metadata?.merchantId;
  if (!merchantId) return;
  try {
    await dispatchMerchantWebhook({
      merchantId,
      event: "payment.failed",
      data: {
        paymentIntentId: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        failureCode: pi.last_payment_error?.code ?? null,
        failureMessage: pi.last_payment_error?.message ?? null,
        paymentLinkId: pi.metadata?.paymentLinkId ?? null,
        customerEmail: pi.metadata?.customerEmail ?? null,
        metadata: pi.metadata ?? {},
      },
    });
  } catch (err) {
    console.error("[webhook] dispatch payment.failed failed", err);
  }
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  connectedAccountId: string | null
) {
  // Find the payment row by PI id so we can update its status and look up
  // the merchant for outbound webhook dispatch.
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

  let merchantId: string | null = null;
  if (piId) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, piId));
    if (payment) {
      merchantId = payment.merchantId;
      await db
        .update(payments)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(payments.id, payment.id));
    }
  }

  if (!merchantId && connectedAccountId) {
    const [m] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.stripeAccountId, connectedAccountId));
    merchantId = m?.id ?? null;
  }
  if (!merchantId) return;

  try {
    await dispatchMerchantWebhook({
      merchantId,
      event: "payment.refunded",
      data: {
        chargeId: charge.id,
        paymentIntentId: piId,
        amountRefunded: charge.amount_refunded,
        currency: charge.currency,
        fullyRefunded: charge.refunded,
        reason: charge.refunds?.data?.[0]?.reason ?? null,
        customerEmail: charge.billing_details?.email ?? null,
      },
    });
  } catch (err) {
    console.error("[webhook] dispatch payment.refunded failed", err);
  }
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

  try {
    await dispatchMerchantWebhook({
      merchantId,
      event: "checkout.session.expired",
      data: {
        sessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        paymentLinkId,
        customerEmail: session.customer_details?.email ?? null,
        customerName: session.customer_details?.name ?? null,
        metadata: session.metadata ?? {},
      },
    });
  } catch (err) {
    console.error("[webhook] dispatch checkout.session.expired failed", err);
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  connectedAccountId: string | null
) {
  // If this session previously existed as an abandoned checkout, mark it recovered
  if (!session.id) return;
  await db
    .update(abandonedCheckouts)
    .set({ status: "recovered", recoveredAt: new Date() })
    .where(eq(abandonedCheckouts.stripeSessionId, session.id));

  // Resolve the merchant (from metadata first, then from connected account).
  // We need this for both the outbound webhook dispatch and the saved-PM
  // mirror below.
  let merchantId = (session.metadata?.merchantId as string | undefined) ?? null;
  if (!merchantId && connectedAccountId) {
    const [m] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.stripeAccountId, connectedAccountId));
    merchantId = m?.id ?? null;
  }

  if (merchantId) {
    // Outbound webhook to merchant servers. This is the event that the
    // SVA LMS (and any other integrator) listens to for enrollment —
    // checkout.session.completed is the first event in the Stripe flow that
    // reliably carries customer_details.email, so it's the right hook for
    // "grant access now that they've paid".
    //
    // Line items are NOT included on Stripe's session object by default;
    // they have to be fetched via listLineItems on the connected account.
    // We fetch them here so merchants who built a multi-item checkout via
    // /api/v1/checkout can read the full cart out of one webhook payload
    // instead of making a second API call.
    let lineItems: {
      description: string | null;
      quantity: number | null;
      amount_subtotal: number | null;
      amount_total: number | null;
      currency: string | null;
      price_id: string | null;
    }[] = [];
    if (connectedAccountId && session.id) {
      try {
        const items = await stripe.checkout.sessions.listLineItems(
          session.id,
          { limit: 100 },
          { stripeAccount: connectedAccountId }
        );
        lineItems = items.data.map((li) => ({
          description: li.description ?? null,
          quantity: li.quantity ?? null,
          amount_subtotal: li.amount_subtotal ?? null,
          amount_total: li.amount_total ?? null,
          currency: li.currency ?? null,
          price_id: typeof li.price === "string" ? li.price : li.price?.id ?? null,
        }));
      } catch (err) {
        console.error("[webhook] listLineItems failed", err);
      }
    }

    try {
      const paymentLinkId =
        (session.metadata?.paymentLinkId as string | undefined) ?? null;
      await dispatchMerchantWebhook({
        merchantId,
        event: "checkout.session.completed",
        data: {
          sessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentLinkId,
          // Echo the dynamic-checkout id back to merchants so they can
          // correlate this webhook with their /api/v1/checkout response.
          jidopayCheckoutId:
            (session.metadata?.jidopayCheckoutId as string | undefined) ?? null,
          clientReferenceId: session.client_reference_id ?? null,
          customerEmail: session.customer_details?.email ?? null,
          customerName: session.customer_details?.name ?? null,
          customerPhone: session.customer_details?.phone ?? null,
          metadata: session.metadata ?? {},
          lineItems,
          mode: session.mode,
          paymentStatus: session.payment_status,
        },
      });
    } catch (err) {
      console.error("[webhook] dispatch checkout.session.completed failed", err);
    }
  }

  // One-click pay: if the session saved a payment method for future off-session
  // use, mirror it into saved_payment_methods so returning customers can skip
  // re-entering card details on this merchant's future payment links.
  if (!connectedAccountId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  if (!paymentIntentId) return;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const email = session.customer_details?.email ?? null;
  if (!stripeCustomerId || !email) return;

  // Resolve the merchant from the connected account
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.stripeAccountId, connectedAccountId));
  if (!merchant) return;

  // Retrieve the PI on the connected account to see if a reusable payment
  // method was attached (setup_future_usage = off_session).
  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      { expand: ["payment_method"] },
      { stripeAccount: connectedAccountId }
    );
  } catch {
    return;
  }

  if (pi.setup_future_usage !== "off_session") return;

  const pm = pi.payment_method as Stripe.PaymentMethod | null;
  if (!pm || pm.type !== "card" || !pm.card) return;

  // Find or create a JidoPay customer row by (merchantId, email).
  // The payments-succeeded handler doesn't create customer rows directly,
  // so we do it here once we have a confirmed email + Stripe customer id.
  const [existingCustomer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.merchantId, merchant.id),
        eq(customers.email, email)
      )
    );

  let customerId: string;
  if (existingCustomer) {
    customerId = existingCustomer.id;
    if (!existingCustomer.stripeCustomerId) {
      await db
        .update(customers)
        .set({ stripeCustomerId, updatedAt: new Date() })
        .where(eq(customers.id, customerId));
    }
  } else {
    customerId = generateId("cus");
    await db.insert(customers).values({
      id: customerId,
      merchantId: merchant.id,
      name: session.customer_details?.name ?? email,
      email,
      phone: session.customer_details?.phone ?? null,
      stripeCustomerId,
    });
  }

  // Upsert the saved payment method. Unique key is stripePaymentMethodId so
  // retries of the same webhook don't double-insert.
  await db
    .insert(savedPaymentMethods)
    .values({
      id: generateId("spm"),
      merchantId: merchant.id,
      customerId,
      stripePaymentMethodId: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: true,
    })
    .onConflictDoNothing();
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

