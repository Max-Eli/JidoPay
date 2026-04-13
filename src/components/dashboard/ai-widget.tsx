"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AiChat } from "@/components/dashboard/ai-chat";

export function AiWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
        className="group fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2.5 rounded-full border border-border/60 bg-card px-5 text-sm font-medium text-foreground shadow-[0_18px_60px_-18px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:scale-[1.03] hover:border-accent/60"
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-accent/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"
        />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Sparkles className="h-4 w-4" />
        </span>
        Ask JidoPay
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            />
            <motion.aside
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              role="dialog"
              aria-label="AI assistant"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border/60 bg-background shadow-[0_0_80px_-20px_rgba(0,0,0,0.4)]"
            >
              <header className="flex items-center justify-between border-b border-border/60 px-6 py-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    JidoPay intelligence
                  </p>
                  <h2 className="mt-1 font-display text-xl">AI assistant</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex flex-1 flex-col overflow-hidden p-4">
                <AiChat />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
