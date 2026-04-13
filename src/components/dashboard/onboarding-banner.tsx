"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2, ShieldCheck } from "lucide-react";

export function OnboardingBanner() {
  const [loading, setLoading] = useState(false);

  async function startOnboarding() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.alreadyConnected) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
              Securely verify your business with our payment infrastructure
              partner. The process takes about five minutes and handles all
              compliance automatically.
            </p>
          </div>
        </div>
        <button
          onClick={startOnboarding}
          disabled={loading}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting
            </>
          ) : (
            <>
              Connect bank
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
