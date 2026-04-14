"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/toaster";

export function SendCampaignButton({
  campaignId,
  campaignName,
  disabled,
}: {
  campaignId: string;
  campaignName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function send() {
    setConfirming(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          "Couldn't send campaign",
          data.error ?? "Please try again in a moment."
        );
        return;
      }
      if (data.recipients === 0) {
        toast.info(
          "No recipients",
          "This audience is empty — nothing was sent."
        );
      } else if (data.failed > 0 && data.sent === 0) {
        toast.error(
          "All deliveries failed",
          `${data.failed} of ${data.recipients} recipients could not be reached.`
        );
      } else if (data.failed > 0) {
        toast.success(
          `${data.sent} sent, ${data.failed} failed`,
          `Delivered to ${data.sent} of ${data.recipients} recipients.`
        );
      } else {
        toast.success(
          `Campaign sent to ${data.sent} recipient${data.sent === 1 ? "" : "s"}`,
          "Delivery and open tracking will update in a minute or two."
        );
      }
      router.refresh();
    } catch {
      toast.error("Connection issue", "We couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => (confirming ? setConfirming(false) : setConfirming(true))}
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

      <AnimatePresence>
        {confirming && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-sm"
              onClick={() => setConfirming(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed left-1/2 top-1/2 z-[95] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-start gap-4 p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg">
                    Send &ldquo;{campaignName}&rdquo;?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Everyone in the selected audience will receive this
                    message immediately. This can&apos;t be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border/60 bg-muted/30 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-full border border-border px-5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={send}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
