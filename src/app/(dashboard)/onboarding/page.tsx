import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, merchants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/dashboard/topbar";
import { ConnectOnboarding } from "@/components/dashboard/connect-onboarding";

export const metadata = { title: "Finish setup" };

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) redirect("/sign-in");
  if (merchant.stripeOnboardingComplete) redirect("/dashboard");

  return (
    <>
      <Topbar
        title="Finish setup"
        description="Verify your business to start accepting payments."
      />

      <div className="mx-auto max-w-3xl space-y-8 px-8 py-10">
        <div className="flex items-center gap-2">
          <span className="h-px w-6 bg-foreground/40" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Step 1 of 1
          </span>
        </div>

        <div>
          <h1 className="font-display text-3xl leading-tight">
            Set up your payout account
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Verify your business identity and connect a bank account so
            JidoPay can route payouts to you. The form below is encrypted
            end-to-end and takes about five minutes to complete.
          </p>
        </div>

        <ConnectOnboarding />

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Your information is protected by bank-grade encryption and is never
          stored on JidoPay&apos;s servers. We use a regulated processing
          partner to handle KYC, AML, and payout compliance.
        </p>
      </div>
    </>
  );
}
