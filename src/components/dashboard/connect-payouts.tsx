"use client";

import {
  ConnectComponentsProvider,
  ConnectPayouts as StripeConnectPayouts,
} from "@stripe/react-connect-js";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type StripeConnectInstance = ReturnType<typeof loadConnectAndInitialize>;

/**
 * Embedded Stripe Connect payouts — balance, history, schedule, and
 * instant payouts — themed to JidoPay. Same Appearance API values as
 * the onboarding component so the two feel visually consistent.
 */
export function ConnectPayouts() {
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/stripe/payouts-session", {
          method: "POST",
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            data.error ?? "Could not load payouts. Please try again."
          );
        }
        const data = (await res.json()) as {
          clientSecret: string;
          publishableKey: string;
        };

        const accent = getCssVar("--accent", "202 100% 61%");
        const background = getCssVar("--background", "0 0% 100%");
        const foreground = getCssVar("--foreground", "220 20% 8%");
        const muted = getCssVar("--muted-foreground", "220 10% 45%");
        const border = getCssVar("--border", "220 13% 91%");
        const destructive = getCssVar("--destructive", "0 72% 51%");

        const connectInstance = loadConnectAndInitialize({
          publishableKey: data.publishableKey,
          fetchClientSecret: async () => data.clientSecret,
          appearance: {
            overlays: "dialog",
            variables: {
              colorPrimary: hsl(accent),
              colorBackground: hsl(background),
              colorText: hsl(foreground),
              colorSecondaryText: hsl(muted),
              colorBorder: hsl(border),
              colorDanger: hsl(destructive),
              buttonPrimaryColorBackground: hsl(foreground),
              buttonPrimaryColorText: hsl(background),
              buttonSecondaryColorBackground: hsl(background),
              buttonSecondaryColorText: hsl(foreground),
              buttonSecondaryColorBorder: hsl(border),
              actionPrimaryColorText: hsl(accent),
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSizeBase: "15px",
              spacingUnit: "10px",
              borderRadius: "14px",
              formHighlightColorBorder: hsl(accent),
              formAccentColor: hsl(accent),
            },
          },
        });

        if (!cancelled) setInstance(connectInstance);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load payouts. Please try again."
          );
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border/60 bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <StripeConnectPayouts />
      </div>
    </ConnectComponentsProvider>
  );
}

function getCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function hsl(value: string): string {
  return `hsl(${value})`;
}
