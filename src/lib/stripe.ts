import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

/** Create or retrieve a Stripe Connect Express account for a merchant */
export async function getOrCreateConnectedAccount(
  merchantId: string,
  email: string
): Promise<Stripe.Account> {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { merchantId },
  });
  return account;
}

/** Generate the Stripe Connect onboarding link */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });
  return link.url;
}

/** Verify a Stripe webhook signature — always use this, never skip */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
