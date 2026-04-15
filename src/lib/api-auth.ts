import crypto from "crypto";
import { db, merchantApiKeys, merchants } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { generateId } from "@/lib/utils";

// Bearer-token auth for the v1 public API. Merchants generate a key from
// the dashboard, send it as `Authorization: Bearer jp_live_...`, and we
// match against a SHA-256 hash in merchant_api_keys. The plaintext is
// never persisted — only shown once at creation.

const KEY_PREFIX = "jp_live_";

export type AuthenticatedMerchant = {
  id: string;
  stripeAccountId: string;
  stripeChargesEnabled: boolean;
  apiKeyId: string;
};

export type ApiAuthResult =
  | { ok: true; merchant: AuthenticatedMerchant }
  | { ok: false; status: number; error: string };

export function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  // 32 random bytes → 43-char base64url, prefixed. ~256 bits of entropy.
  const raw = crypto.randomBytes(32).toString("base64url");
  const plaintext = `${KEY_PREFIX}${raw}`;
  const prefix = plaintext.slice(0, 12); // "jp_live_XXXX"
  const hash = crypto.createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, prefix, hash };
}

function hashKey(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

export async function authenticateApiKey(
  request: Request
): Promise<ApiAuthResult> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing or malformed Authorization header" };
  }
  const plaintext = auth.slice("Bearer ".length).trim();
  if (!plaintext.startsWith(KEY_PREFIX)) {
    return { ok: false, status: 401, error: "Invalid API key format" };
  }

  const hashed = hashKey(plaintext);

  const [row] = await db
    .select({
      keyId: merchantApiKeys.id,
      merchantId: merchantApiKeys.merchantId,
      revokedAt: merchantApiKeys.revokedAt,
      stripeAccountId: merchants.stripeAccountId,
      stripeChargesEnabled: merchants.stripeChargesEnabled,
    })
    .from(merchantApiKeys)
    .innerJoin(merchants, eq(merchantApiKeys.merchantId, merchants.id))
    .where(
      and(
        eq(merchantApiKeys.hashedKey, hashed),
        isNull(merchantApiKeys.revokedAt)
      )
    );

  if (!row) {
    return { ok: false, status: 401, error: "Invalid or revoked API key" };
  }

  if (!row.stripeAccountId || !row.stripeChargesEnabled) {
    return {
      ok: false,
      status: 403,
      error: "Merchant Stripe account not ready for charges",
    };
  }

  // Fire-and-forget lastUsedAt update. Intentionally not awaited so auth
  // stays on the fast path — a missed update is not worth a round trip.
  db.update(merchantApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(merchantApiKeys.id, row.keyId))
    .catch(() => {});

  return {
    ok: true,
    merchant: {
      id: row.merchantId,
      stripeAccountId: row.stripeAccountId,
      stripeChargesEnabled: row.stripeChargesEnabled,
      apiKeyId: row.keyId,
    },
  };
}

export function newApiKeyId(): string {
  return generateId("apk");
}
