import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, merchants } from "@/lib/db";
import {
  stripe,
  getOrCreateConnectedAccount,
  createOnboardingAccountSession,
} from "@/lib/stripe";
import { eq } from "drizzle-orm";

/**
 * Returns the data the embedded Connect onboarding component needs:
 * - accountId: the merchant's Stripe Connect Express account
 * - clientSecret: short-lived Account Session secret that authorizes
 *   the embedded component to act on behalf of that account
 * - publishableKey: platform publishable key the client SDK needs
 * - alreadyConnected: true if the merchant has already finished KYC
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  let accountId = merchant.stripeAccountId;

  if (!accountId) {
    const account = await getOrCreateConnectedAccount(userId, merchant.email);
    accountId = account.id;

    await db
      .update(merchants)
      .set({ stripeAccountId: accountId, updatedAt: new Date() })
      .where(eq(merchants.id, userId));
  } else {
    const account = await stripe.accounts.retrieve(accountId);
    if (account.charges_enabled && account.payouts_enabled) {
      await db
        .update(merchants)
        .set({
          stripeOnboardingComplete: true,
          stripeChargesEnabled: true,
          stripePayoutsEnabled: true,
          updatedAt: new Date(),
        })
        .where(eq(merchants.id, userId));
      return NextResponse.json({ alreadyConnected: true });
    }
  }

  const clientSecret = await createOnboardingAccountSession(accountId);

  return NextResponse.json({
    accountId,
    clientSecret,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
}
