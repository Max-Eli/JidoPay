import Stripe from "stripe";

let cached: Stripe | null = null;

function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  cached = new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });
  return cached;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});

/** Create or retrieve a Stripe Connect Express account for a merchant */
export async function getOrCreateConnectedAccount(
  merchantId: string,
  email: string
): Promise<Stripe.Account> {
  const account = await getStripe().accounts.create({
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

/** Generate the Stripe Connect onboarding link (legacy hosted flow). */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const link = await getStripe().accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });
  return link.url;
}

/**
 * Create an Account Session client secret for the embedded onboarding
 * component. Enables the `account_onboarding` component only — we don't
 * need the full Express dashboard embedded.
 */
export async function createOnboardingAccountSession(
  accountId: string
): Promise<string> {
  const session = await getStripe().accountSessions.create({
    account: accountId,
    components: {
      account_onboarding: {
        enabled: true,
        features: {
          external_account_collection: true,
        },
      },
    },
  });
  return session.client_secret;
}

/** Verify a Stripe webhook signature — always use this, never skip */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
