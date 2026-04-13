"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Flag =
  | "walletEnabled"
  | "oneClickPayEnabled"
  | "abandonedRecoveryEnabled";

export function FeatureToggle({
  flag,
  initial,
  label,
}: {
  flag: Flag;
  initial: boolean;
  label?: string;
}) {
  const [enabled, setEnabled] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !enabled;
    setLoading(true);
    setEnabled(next);
    try {
      const res = await fetch("/api/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flag]: next }),
      });
      if (!res.ok) {
        setEnabled(!next);
        alert("Failed to update setting");
      }
    } catch {
      setEnabled(!next);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-pressed={enabled}
      aria-label={label ?? "Toggle feature"}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
        enabled
          ? "border-accent bg-accent"
          : "border-border bg-muted",
        loading && "opacity-70"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full bg-background shadow transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      </span>
    </button>
  );
}
