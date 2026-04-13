import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, merchants } from "@/lib/db";
import { createPayoutsAccountSession } from "@/lib/stripe";

/**
 * Returns a short-lived Account Session client secret for the embedded
 * <ConnectPayouts /> component. The merchant must have completed Stripe
 * onboarding before this works.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant?.stripeAccountId) {
    return NextResponse.json(
      { error: "No connected Stripe account" },
      { status: 400 }
    );
  }

  const clientSecret = await createPayoutsAccountSession(
    merchant.stripeAccountId
  );

  return NextResponse.json({
    clientSecret,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
}
