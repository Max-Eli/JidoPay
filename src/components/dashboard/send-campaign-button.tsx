"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

export function SendCampaignButton({
  campaignId,
  disabled,
}: {
  campaignId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function send() {
    if (loading || disabled) return;
    const ok = confirm(
      "Send this campaign now? This will message all customers in the selected audience."
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to send campaign");
        return;
      }
      alert(
        `Campaign sent. ${data.sent} delivered, ${data.failed} failed (${data.recipients} total recipients).`
      );
      window.location.reload();
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={send}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/60 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      {loading ? "Sending" : "Send now"}
    </button>
  );
}
