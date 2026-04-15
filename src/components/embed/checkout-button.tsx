"use client";

import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";

export function EmbedCheckoutButton({
  url,
  autoload,
  prefillEmail,
  clientReferenceId,
}: {
  url: string;
  autoload: boolean;
  prefillEmail?: string | null;
  clientReferenceId?: string | null;
}) {
  const finalUrl = buildUrl(url, prefillEmail, clientReferenceId);

  useEffect(() => {
    if (!autoload) return;
    redirectTop(finalUrl);
  }, [finalUrl, autoload]);

  return (
    <button
      type="button"
      onClick={() => redirectTop(finalUrl)}
      className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-all hover:scale-[1.01] hover:bg-foreground/90 active:scale-[0.99]"
    >
      <span>Pay securely</span>
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </button>
  );
}

function buildUrl(
  base: string,
  prefillEmail?: string | null,
  clientReferenceId?: string | null
): string {
  if (!prefillEmail && !clientReferenceId) return base;
  try {
    const u = new URL(base);
    if (prefillEmail) u.searchParams.set("prefilled_email", prefillEmail);
    if (clientReferenceId)
      u.searchParams.set("client_reference_id", clientReferenceId);
    return u.toString();
  } catch {
    return base;
  }
}

function redirectTop(url: string) {
  // When iframed, send the parent to Stripe Checkout so the customer
  // sees the full-page Stripe UI (not a nested iframe). When opened
  // standalone, this is just a normal navigation.
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // Cross-origin access blocked — fall through to self-navigation.
  }
  window.location.href = url;
}
