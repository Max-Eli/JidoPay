"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "jidopay:sms-popup-v1";
const OPEN_DELAY_MS = 1200;

type Status = "idle" | "submitting" | "success" | "error";

export function SmsPopup() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // private mode — fall through and still show once this session
    }
    const t = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/marketing-leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          phone: phone.trim(),
          consent,
          source: "popup",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sms-popup-title"
        >
          {/* Backdrop */}
          <button
            aria-label="Close"
            onClick={dismiss}
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl"
          >
            {/* Accent glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl"
            />

            {/* Close */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground backdrop-blur transition hover:bg-background hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative px-8 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">
              {status === "success" ? (
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-accent/10">
                    <Check className="h-6 w-6 text-accent" />
                  </div>
                  <h2 className="mt-6 font-display text-3xl leading-tight">
                    You&apos;re in.
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Check your phone — we just sent a welcome text. Reply
                    <span className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                      STOP
                    </span>
                    anytime to unsubscribe.
                  </p>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
                  >
                    Back to the site
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Eyebrow */}
                  <div className="flex items-center gap-2">
                    <span className="h-px w-6 bg-foreground/40" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Early access
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/60 backdrop-blur">
                    <MessageCircle
                      className="h-5 w-5 text-accent"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h2
                    id="sms-popup-title"
                    className="mt-6 font-display text-[34px] leading-[1.05] tracking-[-0.01em]"
                  >
                    Get <em className="text-accent">paid</em>
                    <br />
                    get perks.
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Join JidoPay&apos;s text list for product updates, launch
                    invites, and exclusive offers for early merchants.
                  </p>

                  <form onSubmit={onSubmit} className="mt-8 space-y-4">
                    <div>
                      <label
                        htmlFor="smsp-first-name"
                        className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        First name
                      </label>
                      <input
                        id="smsp-first-name"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-accent/60 focus:bg-background"
                        placeholder="Sarah"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="smsp-phone"
                        className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        Mobile number
                      </label>
                      <input
                        id="smsp-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 font-mono text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-accent/60 focus:bg-background"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 pt-2">
                      <input
                        type="checkbox"
                        required
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-accent/40"
                      />
                      <span className="text-[11px] leading-relaxed text-muted-foreground">
                        I agree to receive recurring marketing text messages
                        from JidoPay at the number provided, including messages
                        sent by autodialer. Consent is not a condition of
                        purchase. Msg frequency varies (up to 6 msgs/month).
                        Msg &amp; data rates may apply. Reply{" "}
                        <span className="font-mono text-foreground">STOP</span>{" "}
                        to cancel,{" "}
                        <span className="font-mono text-foreground">HELP</span>{" "}
                        for help. See our{" "}
                        <Link
                          href="/legal/privacy"
                          className="text-accent underline"
                        >
                          Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/legal/terms"
                          className="text-accent underline"
                        >
                          Terms
                        </Link>
                        .
                      </span>
                    </label>

                    {errorMsg && (
                      <p className="text-xs text-red-500">{errorMsg}</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "submitting" || !consent}
                      className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-all hover:scale-[1.01] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {status === "submitting" ? "Sending…" : "Send me updates"}
                      {status !== "submitting" && (
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      )}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={dismiss}
                    className="mt-4 w-full text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
                  >
                    No thanks
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
