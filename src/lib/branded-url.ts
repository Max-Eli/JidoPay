/**
 * Build the merchant-facing share URL for a payment link. This points to
 * /p/[id] on our own domain, which then redirects to the Stripe-hosted
 * checkout URL. Keeps the shareable URL on the JidoPay brand.
 */
export function brandedPayUrl(linkId: string): string {
  return `${baseUrl()}/p/${linkId}`;
}

/**
 * Public storefront URL for a merchant. Resolves to a catalog page that
 * lists every active payment link they own — the zero-code path for
 * merchants who don't have a website to embed on.
 */
export function storefrontUrl(slug: string): string {
  return `${baseUrl()}/shop/${slug}`;
}

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://jidopay.com"
  );
}

// Reserved slugs that would shadow existing routes or look sketchy in the
// wild. Kept here (not in the zod schema) so both the API validator and
// any future CLI tooling share the same list.
export const RESERVED_STOREFRONT_SLUGS = new Set<string>([
  "admin",
  "api",
  "app",
  "auth",
  "blog",
  "campaigns",
  "customers",
  "dashboard",
  "docs",
  "embed",
  "help",
  "invoices",
  "jidopay",
  "login",
  "onboarding",
  "p",
  "payment-links",
  "payments",
  "payouts",
  "pricing",
  "recovery",
  "settings",
  "shop",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "support",
  "wallet",
  "webhooks",
  "www",
]);

/**
 * Validate a storefront slug. Returns the normalized slug on success or
 * a human-readable reason on failure. We enforce:
 *   - 3..32 chars
 *   - lowercase alphanumeric + single-dash separators
 *   - no leading/trailing dashes, no consecutive dashes
 *   - not in the reserved list
 */
export function validateStorefrontSlug(
  input: string
): { ok: true; value: string } | { ok: false; reason: string } {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length < 3) {
    return { ok: false, reason: "Handle must be at least 3 characters." };
  }
  if (trimmed.length > 32) {
    return { ok: false, reason: "Handle must be 32 characters or less." };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    return {
      ok: false,
      reason:
        "Use lowercase letters, numbers, and single dashes only (no spaces).",
    };
  }
  if (RESERVED_STOREFRONT_SLUGS.has(trimmed)) {
    return { ok: false, reason: "That handle is reserved. Try another." };
  }
  return { ok: true, value: trimmed };
}
