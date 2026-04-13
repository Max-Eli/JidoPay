"use client";

import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type StripeConnectInstance = ReturnType<typeof loadConnectAndInitialize>;

/**
 * Embedded Stripe Connect onboarding, themed to match JidoPay. Uses an
 * Account Session client_secret fetched from /api/stripe/connect, and the
 * Appearance API to force Stripe's UI into JidoPay's accent, font, and
 * border radius. On completion, redirects to /dashboard.
 *
 * Note: Stripe's "Powered by Stripe" footer inside the embedded component
 * cannot be removed — it's baked into the component and required by
 * Stripe's Terms of Service. We shrink its visual weight by rendering the
 * component inside a large JidoPay-branded container (the parent page
 * provides the dominant visual hierarchy).
 */
export function ConnectOnboarding() {
  const router = useRouter();
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/stripe/connect", { method: "POST" });
        if (!res.ok) {
          throw new Error("Failed to create onboarding session");
        }
        const data = (await res.json()) as {
          clientSecret?: string;
          publishableKey?: string;
          alreadyConnected?: boolean;
        };

        if (data.alreadyConnected) {
          router.push("/dashboard");
          return;
        }
        if (!data.clientSecret || !data.publishableKey) {
          throw new Error("Missing onboarding session data");
        }

        const accent = getCssVar("--accent", "202 100% 61%");
        const background = getCssVar("--background", "0 0% 100%");
        const foreground = getCssVar("--foreground", "220 20% 8%");
        const muted = getCssVar("--muted-foreground", "220 10% 45%");
        const border = getCssVar("--border", "220 13% 91%");
        const destructive = getCssVar("--destructive", "0 72% 51%");

        const connectInstance = loadConnectAndInitialize({
          publishableKey: data.publishableKey,
          fetchClientSecret: async () => data.clientSecret!,
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
              : "Could not load onboarding. Please try again."
          );
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <ConnectAccountOnboarding
          onExit={() => {
            router.push("/onboarding/return");
          }}
        />
      </div>
    </ConnectComponentsProvider>
  );
}

/** Read an HSL CSS variable set on :root by globals.css. SSR fallback. */
function getCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Convert "220 20% 8%" → "hsl(220 20% 8%)" for Stripe's Appearance API. */
function hsl(value: string): string {
  return `hsl(${value})`;
}
