"use client";

import { useState } from "react";
import { Plus, Loader2, X } from "lucide-react";

interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

export function WalletCreditButton({ customers }: { customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountInCents) || amountInCents < 1) {
        setError("Enter a valid amount");
        return;
      }
      const res = await fetch("/api/wallet/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          amount: amountInCents,
          type: "credit",
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed");
        return;
      }
      setOpen(false);
      setAmount("");
      setNote("");
      window.location.reload();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={customers.length === 0}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Credit wallet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.4)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-32 -top-32 h-60 w-60 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative mb-6 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Wallet
                </p>
                <h2 className="mt-1 font-display text-2xl">Credit balance</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-5">
              <Field label="Customer">
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.email}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Amount (USD)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-8 pr-4 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
              </Field>

              <Field label="Note">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </Field>

              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border border-border px-5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Credit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
