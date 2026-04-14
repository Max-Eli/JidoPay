import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
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
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, userId));

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    let accountId = merchant.stripeAccountId;

    // If we already have an account ID, try to fetch it. If the ID is
    // from a different Stripe platform (e.g. you switched keys) Stripe
    // returns resource_missing — clear the stale ID and fall through
    // to create a fresh account on the current platform.
    if (accountId) {
      try {
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
      } catch (err) {
        if (
          err instanceof Stripe.errors.StripeError &&
          err.code === "resource_missing"
        ) {
          console.warn(
            `[connect] stale stripeAccountId=${accountId} for merchant=${userId}, clearing and recreating`
          );
          accountId = null;
          await db
            .update(merchants)
            .set({
              stripeAccountId: null,
              stripeOnboardingComplete: false,
              stripeChargesEnabled: false,
              stripePayoutsEnabled: false,
              updatedAt: new Date(),
            })
            .where(eq(merchants.id, userId));
        } else {
          throw err;
        }
      }
    }

    if (!accountId) {
      const account = await getOrCreateConnectedAccount(userId, merchant.email);
      accountId = account.id;

      await db
        .update(merchants)
        .set({ stripeAccountId: accountId, updatedAt: new Date() })
        .where(eq(merchants.id, userId));
    }

    const clientSecret = await createOnboardingAccountSession(accountId);

    return NextResponse.json({
      accountId,
      clientSecret,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    // Surface the real Stripe error so merchants see something useful
    // instead of a blank 500. Server logs get the full stack.
    console.error("[connect] failed to create onboarding session", err);

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code ?? null,
          type: err.type,
        },
        { status: err.statusCode ?? 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create onboarding session",
      },
      { status: 500 }
    );
  }
}
