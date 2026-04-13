import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret =
    process.env.UNSUBSCRIBE_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "UNSUBSCRIBE_SECRET is not set (STRIPE_WEBHOOK_SECRET fallback also missing)"
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

/**
 * Generate a stateless unsubscribe token. Encodes the customer + channel
 * + merchant so a single URL can opt a customer out without a DB lookup
 * at mint time. Verified via HMAC on redemption.
 */
export function createUnsubscribeToken(params: {
  customerId: string;
  merchantId: string;
  channel: "email" | "sms";
}): string {
  const payload = `${params.customerId}.${params.merchantId}.${params.channel}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): {
  customerId: string;
  merchantId: string;
  channel: "email" | "sms";
} | null {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const parts = decoded.split(".");
  if (parts.length !== 4) return null;
  const [customerId, merchantId, channel, sig] = parts;
  if (channel !== "email" && channel !== "sms") return null;

  const expected = sign(`${customerId}.${merchantId}.${channel}`);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;

  return { customerId, merchantId, channel };
}

/** Absolute URL for the unsubscribe confirmation page. */
export function buildUnsubscribeUrl(params: {
  customerId: string;
  merchantId: string;
  channel: "email" | "sms";
}): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://jidopay.com";
  const token = createUnsubscribeToken(params);
  return `${base}/unsubscribe/${token}`;
}
