"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Loader2,
  Archive,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Status = "active" | "inactive" | "expired";

interface EditPaymentLinkFormProps {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  status: Status;
  type: "one_time" | "recurring";
}

/**
 * Two-part edit flow:
 *   1. Rename / rewrite description / archive-or-reactivate — straight PATCH
 *   2. Change the price — Stripe payment links are immutable on line items,
 *      so this calls /duplicate which clones the link with a new price and
 *      archives the original. The merchant keeps the old URL working for
 *      in-flight shares and gets a fresh one for new customers.
 */
export function EditPaymentLinkForm(props: EditPaymentLinkFormProps) {
  const router = useRouter();
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [status, setStatus] = useState<Status>(props.status);
  const [newAmount, setNewAmount] = useState(
    (props.amount / 100).toFixed(2)
  );
  const [savingDetails, setSavingDetails] = useState(false);
  const [savedDetails, setSavedDetails] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveDetails() {
    setSavingDetails(true);
    setSavedDetails(false);
    setError(null);
    try {
      const res = await fetch(`/api/payment-links/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save changes");
        return;
      }
      setSavedDetails(true);
      router.refresh();
      setTimeout(() => setSavedDetails(false), 2500);
    } finally {
      setSavingDetails(false);
    }
  }

  async function duplicateWithNewPrice() {
    setSavingPrice(true);
    setError(null);
    const amountInCents = Math.round(parseFloat(newAmount) * 100);
    if (!Number.isFinite(amountInCents) || amountInCents < 50) {
      setError("New amount must be at least $0.50");
      setSavingPrice(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/payment-links/${props.id}/duplicate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: description || null,
            amount: amountInCents,
            archiveOriginal: true,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not create replacement link");
        return;
      }
      router.push("/payment-links");
    } finally {
      setSavingPrice(false);
    }
  }

  const priceChanged =
    Math.round(parseFloat(newAmount) * 100) !== props.amount;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Details
          </p>
          <h2 className="mt-1 font-display text-lg">
            Name, description, and status
          </h2>
        </div>
        <div className="space-y-5 px-6 py-6">
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Optional"
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>

          <Field label="Status">
            <div className="flex gap-2">
              <StatusTile
                active={status === "active"}
                onClick={() => setStatus("active")}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                label="Active"
                hint="Accepting payments"
              />
              <StatusTile
                active={status === "inactive"}
                onClick={() => setStatus("inactive")}
                icon={<Archive className="h-3.5 w-3.5" />}
                label="Archived"
                hint="Stops new checkouts"
              />
            </div>
          </Field>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveDetails}
              disabled={savingDetails || !name.trim()}
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDetails ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving
                </>
              ) : savedDetails ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </>
              ) : (
                <>
                  Save changes
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Price
          </p>
          <h2 className="mt-1 font-display text-lg">
            Replace with a new amount
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The current price is{" "}
            <span className="font-mono text-foreground">
              {formatCurrency(props.amount, props.currency)}
            </span>
            {props.type === "recurring" ? " per billing period" : ""}. To
            change it, we&apos;ll create a new link at the new price and
            archive this one — existing shares keep working.
          </p>
        </div>
        <div className="space-y-5 px-6 py-6">
          <Field label={`New amount (${props.currency.toUpperCase()})`}>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="0.50"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pl-8 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </Field>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={duplicateWithNewPrice}
              disabled={savingPrice || !priceChanged}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-xs font-medium text-foreground transition-all hover:scale-[1.02] hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPrice ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Replacing
                </>
              ) : (
                <>
                  Replace at new price
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
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

function StatusTile({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border px-4 py-3 text-left transition-all",
        active
          ? "border-accent/60 bg-accent/5"
          : "border-border/60 bg-background hover:border-border"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-display text-sm">{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}
