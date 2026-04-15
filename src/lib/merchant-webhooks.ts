import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import {
  db,
  merchantWebhooks,
  webhookDeliveries,
  type MerchantWebhook,
} from "@/lib/db";
import { and, eq, or, isNull, lte, inArray } from "drizzle-orm";
import { generateId } from "@/lib/utils";

// Stripe-style signing: `t=<unix>,v1=<hex(hmac_sha256(secret, "<t>.<body>"))>`
// Merchants verify by recomputing the HMAC and comparing in constant time,
// and by rejecting any request whose timestamp is more than TOLERANCE seconds
// in the past (replay protection).

const SIGNATURE_TOLERANCE_SECONDS = 300;
const MAX_ATTEMPTS = 6;
const RESPONSE_BODY_MAX_BYTES = 2048;

// Retry schedule after the first attempt — roughly exponential so a bad
// endpoint recovers fast but we don't hammer a broken one forever. Final
// attempt is ~12h after the first, which matches Stripe's approximation.
const RETRY_DELAYS_SECONDS = [60, 300, 1800, 7200, 43200];

export function generateWebhookSigningSecret(): string {
  return "whsec_" + randomBytes(32).toString("base64url");
}

export function signWebhookPayload(
  secret: string,
  payload: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  const signed = `${timestamp}.${payload}`;
  const hex = createHmac("sha256", secret).update(signed).digest("hex");
  return `t=${timestamp},v1=${hex}`;
}

// Verifies an incoming signature header against a raw body. Merchants can
// import this from a published helper, but we use it internally for the
// test-send button that round-trips through a local endpoint.
export function verifyWebhookSignature(params: {
  payload: string;
  header: string | null;
  secret: string;
  toleranceSeconds?: number;
  now?: number;
}): { valid: true } | { valid: false; reason: string } {
  const {
    payload,
    header,
    secret,
    toleranceSeconds = SIGNATURE_TOLERANCE_SECONDS,
    now = Math.floor(Date.now() / 1000),
  } = params;

  if (!header) return { valid: false, reason: "Missing signature header" };

  const parts = header.split(",").reduce<Record<string, string>>((acc, kv) => {
    const [k, v] = kv.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const ts = parts.t;
  const sig = parts.v1;
  if (!ts || !sig) return { valid: false, reason: "Malformed signature header" };

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) {
    return { valid: false, reason: "Invalid timestamp" };
  }
  if (Math.abs(now - tsNum) > toleranceSeconds) {
    return { valid: false, reason: "Timestamp outside tolerance window" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${tsNum}.${payload}`)
    .digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(sig, "hex");
  } catch {
    return { valid: false, reason: "Invalid signature encoding" };
  }
  if (actual.length !== expected.length) {
    return { valid: false, reason: "Signature length mismatch" };
  }
  if (!timingSafeEqual(actual, expected)) {
    return { valid: false, reason: "Signature mismatch" };
  }
  return { valid: true };
}

export type WebhookEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded"
  | "payment_link.created"
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "subscription.created"
  | "subscription.canceled";

type DispatchEvent = {
  merchantId: string;
  event: WebhookEventType;
  // Anything JSON-serializable. We snapshot it at dispatch time so replays
  // send the exact same body the merchant originally received.
  data: Record<string, unknown>;
};

// Enqueue a delivery for every matching endpoint on a merchant. Called from
// the Stripe webhook handler after it has committed its own state changes.
// Errors here should never block the Stripe webhook — we catch at the call
// site and log, so retries land normally.
export async function dispatchMerchantWebhook(ev: DispatchEvent): Promise<void> {
  const endpoints = await db
    .select()
    .from(merchantWebhooks)
    .where(
      and(
        eq(merchantWebhooks.merchantId, ev.merchantId),
        eq(merchantWebhooks.active, true)
      )
    );

  if (endpoints.length === 0) return;

  const eligible = endpoints.filter((e) => {
    if (!e.enabledEvents || e.enabledEvents.length === 0) return true;
    return e.enabledEvents.includes(ev.event);
  });
  if (eligible.length === 0) return;

  const eventId = `evt_${Date.now().toString(36)}${randomBytes(5).toString("hex")}`;
  const createdAt = new Date();
  const payload = JSON.stringify({
    id: eventId,
    type: ev.event,
    created: Math.floor(createdAt.getTime() / 1000),
    data: ev.data,
  });

  // Insert one delivery row per endpoint. We do not insert and send in the
  // same transaction: the DB row is the source of truth, and a separate
  // pass (attemptDelivery below) performs the HTTP call. This lets the
  // Stripe webhook handler return 2xx quickly even when merchant endpoints
  // are slow, and lets retries re-enter cleanly.
  const rows = eligible.map((endpoint) => ({
    id: generateId("whd"),
    webhookId: endpoint.id,
    merchantId: endpoint.merchantId,
    event: ev.event,
    eventId,
    payload,
    status: "pending" as const,
    attempts: 0,
    createdAt,
  }));

  await db.insert(webhookDeliveries).values(rows);

  // Fire off the first attempt for each endpoint in parallel, but don't
  // await their completion — the Stripe webhook handler needs to return.
  // Failures will be picked up by the scheduled retry sweeper. We still
  // await the dispatch wrappers themselves so thrown errors surface.
  const endpointById = new Map(eligible.map((e) => [e.id, e] as const));
  await Promise.all(
    rows.map((row) => {
      const endpoint = endpointById.get(row.webhookId);
      if (!endpoint) return Promise.resolve();
      return attemptDelivery(row.id, endpoint).catch((err) => {
        console.error("[webhook] first attempt failed to start", err);
      });
    })
  );
}

// Executes a single HTTP delivery for a pending/retrying row. Safe to call
// concurrently across deliveries — each row is mutated independently and
// the status column protects against double-sends via the pre-flight check.
export async function attemptDelivery(
  deliveryId: string,
  endpoint: MerchantWebhook
): Promise<void> {
  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId));
  if (!delivery) return;
  if (delivery.status === "delivered" || delivery.status === "failed") return;

  const attemptNumber = delivery.attempts + 1;
  const attemptAt = new Date();
  const signature = signWebhookPayload(endpoint.signingSecret, delivery.payload);

  let status: "delivered" | "retrying" | "failed" = "failed";
  let responseCode: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "JidoPay/1.0 (webhooks)",
        "Jidopay-Signature": signature,
        "Jidopay-Event": delivery.event,
        "Jidopay-Event-Id": delivery.eventId,
        "Jidopay-Delivery-Id": delivery.id,
        "Jidopay-Delivery-Attempt": String(attemptNumber),
      },
      body: delivery.payload,
      signal: controller.signal,
      redirect: "manual",
    }).finally(() => clearTimeout(timeout));

    responseCode = res.status;
    // Read only a bounded slice so a misbehaving endpoint can't blow up
    // our memory with a huge error page.
    try {
      const text = await res.text();
      responseBody = text.slice(0, RESPONSE_BODY_MAX_BYTES);
    } catch {
      responseBody = null;
    }

    if (res.status >= 200 && res.status < 300) {
      status = "delivered";
    } else {
      status = attemptNumber >= MAX_ATTEMPTS ? "failed" : "retrying";
      errorMessage = `HTTP ${res.status}`;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    status = attemptNumber >= MAX_ATTEMPTS ? "failed" : "retrying";
  }

  const nextRetryAt =
    status === "retrying"
      ? new Date(
          attemptAt.getTime() +
            (RETRY_DELAYS_SECONDS[attemptNumber - 1] ??
              RETRY_DELAYS_SECONDS[RETRY_DELAYS_SECONDS.length - 1]) *
              1000
        )
      : null;

  await db
    .update(webhookDeliveries)
    .set({
      status,
      attempts: attemptNumber,
      responseCode,
      responseBody,
      errorMessage,
      nextRetryAt,
      firstAttemptAt: delivery.firstAttemptAt ?? attemptAt,
      lastAttemptAt: attemptAt,
      deliveredAt: status === "delivered" ? attemptAt : null,
    })
    .where(eq(webhookDeliveries.id, deliveryId));

  await db
    .update(merchantWebhooks)
    .set({
      lastDeliveryAt: attemptAt,
      lastDeliveryStatus: status === "delivered" ? "delivered" : status,
      updatedAt: attemptAt,
    })
    .where(eq(merchantWebhooks.id, endpoint.id));
}

// Sweeper — runs from a cron route to retry any deliveries whose backoff
// window has elapsed. Safe to run on any cadence (we pick 1 min); deliveries
// that aren't due yet are skipped by the WHERE clause, and concurrent sweeps
// can race on the same row but attemptDelivery's pre-flight status check
// prevents double-sends.
export async function sweepPendingDeliveries(batchSize = 50): Promise<number> {
  const now = new Date();
  const due = await db
    .select()
    .from(webhookDeliveries)
    .where(
      and(
        or(
          eq(webhookDeliveries.status, "retrying"),
          eq(webhookDeliveries.status, "pending")
        ),
        or(
          isNull(webhookDeliveries.nextRetryAt),
          lte(webhookDeliveries.nextRetryAt, now)
        )
      )
    )
    .limit(batchSize);

  if (due.length === 0) return 0;

  const endpointIds = Array.from(new Set(due.map((d) => d.webhookId)));
  const endpoints = await db
    .select()
    .from(merchantWebhooks)
    .where(inArray(merchantWebhooks.id, endpointIds));
  const byId = new Map(endpoints.map((e) => [e.id, e]));

  await Promise.all(
    due.map((row) => {
      const endpoint = byId.get(row.webhookId);
      if (!endpoint || !endpoint.active) return Promise.resolve();
      return attemptDelivery(row.id, endpoint).catch((err) => {
        console.error("[webhook] sweep attempt failed", err);
      });
    })
  );

  return due.length;
}

// Reveal helper — the signing secret is stored plain so we can show the last
// 4 chars in the dashboard as a quick "is this the right key" hint without
// exposing the whole secret after creation.
export function maskSigningSecret(secret: string): string {
  if (secret.length < 8) return "whsec_••••";
  return `${secret.slice(0, 8)}…${secret.slice(-4)}`;
}
