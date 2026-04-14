"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Loader2, Zap, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

type LinkType = "one_time" | "recurring";
type Interval = "day" | "week" | "month" | "year";

const INTERVALS: { value: Interval; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export function NewPaymentLinkForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<LinkType>("one_time");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [interval, setInterval] = useState<Interval>("month");
  const [intervalCount, setIntervalCount] = useState("1");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountInCents) || amountInCents < 50) {
      setError("Amount must be at least $0.50");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          amount: amountInCents,
          currency,
          type,
          ...(type === "recurring"
            ? {
                interval,
                intervalCount: parseInt(intervalCount, 10) || 1,
              }
            : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/payment-links");
      router.refresh();
    } catch {
      setError("Failed to create payment link");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Link
        href="/payment-links"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to payment links
      </Link>

      {/* Type selector */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Type
          </p>
          <h2 className="mt-1 font-display text-lg">How do you want to charge?</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <TypeTile
            active={type === "one_time"}
            icon={Zap}
            title="One-time"
            description="Charge once for a product or service."
            onClick={() => setType("one_time")}
          />
          <TypeTile
            active={type === "recurring"}
            icon={Repeat}
            title="Subscription"
            description="Bill automatically on a schedule."
            onClick={() => setType("recurring")}
          />
        </div>
      </section>

      {/* Product */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Product
          </p>
          <h2 className="mt-1 font-display text-lg">What are you selling?</h2>
        </div>
        <div className="space-y-5 p-6">
          <Field label="Product name" required>
            <input
              type="text"
              required
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === "recurring" ? "Pro plan" : "Consultation fee"
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What customers will see on the checkout page."
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
        </div>
      </section>

      {/* Pricing */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-1 font-display text-lg">Set the price</h2>
        </div>
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Amount" required>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min="0.50"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-8 pr-4 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
              </Field>
            </div>
            <Field label="Currency">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
                <option value="cad">CAD</option>
                <option value="aud">AUD</option>
              </select>
            </Field>
          </div>

          {type === "recurring" && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Billing schedule
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Customers will be charged automatically. Cancel anytime from the
                subscription page.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Every">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={intervalCount}
                    onChange={(e) => setIntervalCount(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </Field>
                <Field label="Interval">
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value as Interval)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    {INTERVALS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/payment-links"
          className="rounded-full border border-border px-5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating
            </>
          ) : (
            <>
              Create link
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function TypeTile({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-start gap-4 rounded-xl border p-5 text-left transition-all",
        active
          ? "border-accent bg-accent/10"
          : "border-border bg-background hover:border-accent/60"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 transition-colors",
          active ? "border-accent/40 bg-accent/10 text-accent" : "text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-base text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {active && (
        <span
          aria-hidden
          className="absolute right-4 top-4 h-2 w-2 rounded-full bg-accent"
        />
      )}
    </button>
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
