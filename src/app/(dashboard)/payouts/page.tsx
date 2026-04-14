import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Landmark, Zap } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, merchants } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { ConnectPayouts } from "@/components/dashboard/connect-payouts";

export const metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) redirect("/sign-in");

  // Merchant hasn't finished KYC yet — nudge them to onboarding first.
  if (!merchant.stripePayoutsEnabled) {
    return (
      <>
        <Topbar
          title="Payouts"
          description="Manage your balance and payout schedule."
        />
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <Landmark className="h-5 w-5 text-accent" />
              </div>
              <h2 className="mt-6 font-display text-2xl">
                Finish setup to enable payouts
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                You need to complete business verification and link a
                payout account before JidoPay can route funds to you. It
                takes about five minutes.
              </p>
              <Link
                href="/onboarding"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
              >
                Finish setup
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Payouts"
        description="Manage your balance, payout schedule, and instant transfers."
      />

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                <Landmark className="h-4 w-4 text-accent" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Standard payouts
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Free. Arrive in your linked bank account within{" "}
              <span className="font-medium text-foreground">
                2 business days
              </span>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Instant payouts
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Land in your debit card in{" "}
              <span className="font-medium text-foreground">~30 minutes</span>.
              1.5% fee (min $0.50), available 24/7.
            </p>
          </div>
        </div>

        <ConnectPayouts />

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Payouts on your bank statement will appear as{" "}
          <span className="font-mono text-foreground">JIDOPAY</span>. If
          you don&apos;t see a payout you were expecting, check that your
          business is fully verified and your external account is linked.
        </p>
      </div>
    </>
  );
}
