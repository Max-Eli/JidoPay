"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

export function RemindButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function send() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/abandoned-checkouts/${id}/remind`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to send reminder");
        return;
      }
      alert(`Reminder sent via ${data.channel}`);
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
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/60 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      {loading ? "Sending" : "Send reminder"}
    </button>
  );
}
