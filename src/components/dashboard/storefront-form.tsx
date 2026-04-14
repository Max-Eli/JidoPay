"use client";

import { useMemo, useState } from "react";
import { Loader2, Check, ArrowUpRight, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface StorefrontFormProps {
  initialSlug: string;
  initialTagline: string;
  initialEnabled: boolean;
}

export function StorefrontForm({
  initialSlug,
  initialTagline,
  initialEnabled,
}: StorefrontFormProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [tagline, setTagline] = useState(initialTagline);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const baseUrl = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "https://jidopay.com";
  }, []);

  // Only show the live preview URL once the storefront has been published
  // with a slug — otherwise the link would 404 and confuse the merchant.
  const liveUrl =
    enabled && slug.trim().length > 0
      ? `${baseUrl}/shop/${slug.trim()}`
      : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefrontSlug: slug.trim() || null,
          storefrontTagline: tagline.trim() || null,
          storefrontEnabled: enabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          "Couldn't save storefront",
          data.error ?? "Please try again."
        );
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success(
        enabled ? "Storefront published" : "Storefront settings saved",
        enabled && slug
          ? `Live at /shop/${slug.trim()}`
          : "Your storefront is currently hidden."
      );
    } catch {
      toast.error("Couldn't save storefront", "Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLiveUrl() {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      toast.success("Link copied", liveUrl);
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-start justify-between gap-6 rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm">Publish storefront</p>
          <p className="mt-1 text-xs text-muted-foreground">
            When off, your storefront URL returns a 404. Turn on once you&apos;re
            happy with your handle and tagline.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            enabled ? "bg-accent" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Handle */}
      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Handle
        </label>
        <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
          <span className="pl-4 pr-1 font-mono text-xs text-muted-foreground">
            jidopay.com/shop/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="sarahscakes"
            maxLength={32}
            className="flex-1 bg-transparent py-2.5 pr-4 text-sm outline-none"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Lowercase letters, numbers, and dashes only. 3–32 characters. This is
          the URL you&apos;ll share on social, in your bio, or in texts.
        </p>
      </div>

      {/* Tagline */}
      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Tagline
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Fresh cakes baked to order, delivered same-day."
          maxLength={160}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          One sentence shown under your name on your public storefront.
        </p>
      </div>

      {/* Live URL preview + copy */}
      {liveUrl && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Live at
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="truncate font-mono text-xs text-foreground">
              {liveUrl}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={copyLiveUrl}
                title="Copy link"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
              >
                <Copy className="h-3 w-3" />
              </button>
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open storefront"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving
          </>
        ) : saved ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Saved
          </>
        ) : (
          <>
            Save storefront
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}
