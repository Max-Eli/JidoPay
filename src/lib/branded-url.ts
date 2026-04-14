/**
 * Build the merchant-facing share URL for a payment link. This points to
 * /p/[id] on our own domain, which then redirects to the Stripe-hosted
 * checkout URL. Keeps the shareable URL on the JidoPay brand.
 */
export function brandedPayUrl(linkId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://jidopay.com";
  return `${base}/p/${linkId}`;
}
