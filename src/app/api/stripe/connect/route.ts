import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, merchants } from "@/lib/db";
import { stripe, getOrCreateConnectedAccount, createAccountLink } from "@/lib/stripe";
import { eq } from "drizzle-orm";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  let accountId = merchant.stripeAccountId;

  // If no connected account yet, create one
  if (!accountId) {
    const account = await getOrCreateConnectedAccount(userId, merchant.email);
    accountId = account.id;

    await db
      .update(merchants)
      .set({ stripeAccountId: accountId, updatedAt: new Date() })
      .where(eq(merchants.id, userId));
  } else {
    // Check if already fully onboarded
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

  const onboardingUrl = await createAccountLink(
    accountId,
    `${appUrl}/onboarding/return`,
    `${appUrl}/onboarding/refresh`
  );

  return NextResponse.json({ url: onboardingUrl });
}
