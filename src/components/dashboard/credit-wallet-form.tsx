"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";

interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

export function CreditWalletForm({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountInCents) || amountInCents < 1) {
      setError("Enter a valid amount");
      setLoading(false);
      return;
    }

    try {
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
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to credit wallet");
        setLoading(false);
        return;
      }
      router.push("/wallet");
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href="/wallet"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to wallets
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-display text-lg">No customers yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            You need at least one customer before you can credit a wallet.
          </p>
          <Link
            href="/customers/new"
            className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
          >
            Add a customer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Link
        href="/wallet"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to wallets
      </Link>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Wallet credit
          </p>
          <h2 className="mt-1 font-display text-lg">Credit details</h2>
        </div>
        <div className="space-y-5 p-6">
          <Field label="Customer" required>
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

          <Field label="Amount (USD)" required>
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
              placeholder="Optional — shown in audit log"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/wallet"
          className="rounded-full border border-border px-5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving
            </>
          ) : (
            "Credit wallet"
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
}
