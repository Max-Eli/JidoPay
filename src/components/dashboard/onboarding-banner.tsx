import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export function OnboardingBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Finish setup
            </p>
            <h3 className="mt-1 font-display text-2xl">
              Connect your bank to start accepting payments
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Verify your business and link a payout account. The process is
              encrypted end-to-end and takes about five minutes.
            </p>
          </div>
        </div>
        <Link
          href="/onboarding"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
        >
          Finish setup
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
