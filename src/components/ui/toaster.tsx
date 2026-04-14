"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
};

type ToastInput = Omit<Toast, "id">;

type Listener = (t: Toast) => void;

const listeners = new Set<Listener>();
let nextId = 0;

/**
 * Global toast dispatcher. Any client component can call
 *   toast.success("Saved", "Everything looks good")
 * and the <Toaster /> mounted in the dashboard layout will render it.
 *
 * No context drilling — subscribers register themselves on mount.
 */
export const toast = {
  success(title: string, description?: string) {
    emit({ variant: "success", title, description });
  },
  error(title: string, description?: string) {
    emit({ variant: "error", title, description });
  },
  info(title: string, description?: string) {
    emit({ variant: "info", title, description });
  },
};

function emit(input: ToastInput) {
  const t: Toast = { id: ++nextId, ...input };
  listeners.forEach((l) => l(t));
}

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> =
  {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success:
    "border-emerald-500/30 bg-emerald-500/5 [&_[data-icon]]:text-emerald-500",
  error:
    "border-destructive/40 bg-destructive/5 [&_[data-icon]]:text-destructive",
  info: "border-accent/30 bg-accent/5 [&_[data-icon]]:text-accent",
};

/**
 * Mount once near the top of the tree. Listens for dispatches and
 * renders a stack in the bottom-right. Each toast auto-dismisses after
 * 4.5s unless hovered.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => {
      setToasts((prev) => [...prev, t]);
      // Auto-dismiss after the animation-comfortable window.
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4500);
      // Capture timer on the toast so we could cancel on hover later.
      (t as Toast & { _timer: number })._timer = timer;
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
                mass: 0.6,
              }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-card/95 px-4 py-3.5 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm",
                VARIANT_CLASSES[t.variant]
              )}
            >
              <span
                data-icon
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm leading-tight text-foreground">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
