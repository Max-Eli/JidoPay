import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, merchants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OnboardingReturnPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant?.stripeAccountId) redirect("/dashboard");

  // Check current account status with the payments provider.
  const account = await stripe.accounts.retrieve(merchant.stripeAccountId);

  const isComplete = account.charges_enabled && account.payouts_enabled;

  if (isComplete) {
    await db
      .update(merchants)
      .set({
        stripeOnboardingComplete: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, userId));
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        {isComplete ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              You&apos;re all set!
            </h1>
            <p className="mt-2 text-gray-500">
              Your payout account is connected. You can now start accepting
              payments from your customers.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <XCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Almost there
            </h1>
            <p className="mt-2 text-gray-500">
              Your payout setup isn&apos;t complete yet. You may need to
              provide additional information.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/onboarding/refresh">Continue Setup</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
