"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Loader2, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type LineItem = {
  description: string;
  quantity: string;
  unitAmount: string; // dollars, as a string while editing
};

const emptyLine = (): LineItem => ({
  description: "",
  quantity: "1",
  unitAmount: "",
});

export function NewInvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyLine()]);

  const { subtotalCents, taxCents, totalCents } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const qty = parseInt(item.quantity || "0", 10);
      const unit = Math.round(parseFloat(item.unitAmount || "0") * 100);
      if (!Number.isFinite(qty) || !Number.isFinite(unit)) return sum;
      return sum + Math.max(0, qty) * Math.max(0, unit);
    }, 0);
    const tax = Math.max(0, Math.round(parseFloat(taxAmount || "0") * 100));
    return {
      subtotalCents: subtotal,
      taxCents: tax,
      totalCents: subtotal + tax,
    };
  }, [items, taxAmount]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function addLine() {
    setItems((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedItems = items
      .map((item) => ({
        description: item.description.trim(),
        quantity: parseInt(item.quantity || "0", 10),
        unitAmount: Math.round(parseFloat(item.unitAmount || "0") * 100),
      }))
      .filter(
        (item) =>
          item.description.length > 0 &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.unitAmount) &&
          item.unitAmount > 0
      );

    if (cleanedItems.length === 0) {
      setError("Add at least one line item with a description and amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          items: cleanedItems,
          taxAmount: taxCents,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Could not create invoice.");
      }

      router.push("/invoices");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create invoice."
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to invoices
        </Link>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-5 font-display text-lg">Customer</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" required>
            <input
              type="text"
              required
              maxLength={255}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Acme Inc."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              required
              maxLength={255}
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="billing@acme.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field label="Tax (USD)">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-8 pr-4 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg">Line items</h2>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/60 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Add line
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_5rem_7rem_auto] gap-2 sm:gap-3"
            >
              <input
                type="text"
                required
                maxLength={500}
                value={item.description}
                onChange={(e) =>
                  updateItem(index, { description: e.target.value })
                }
                placeholder="Description"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <input
                type="number"
                required
                min="1"
                max="1000"
                step="1"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, { quantity: e.target.value })
                }
                placeholder="Qty"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={item.unitAmount}
                  onChange={(e) =>
                    updateItem(index, { unitAmount: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <button
                type="button"
                onClick={() => removeLine(index)}
                disabled={items.length === 1}
                title="Remove line"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 border-t border-border/60 pt-5 text-sm">
          <Row label="Subtotal" value={formatCurrency(subtotalCents)} />
          <Row label="Tax" value={formatCurrency(taxCents)} />
          <Row
            label="Total"
            value={formatCurrency(totalCents)}
            emphasize
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <Field label="Notes">
          <textarea
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional — payment terms, thank you note, etc."
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </Field>
      </section>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/invoices"
          className="rounded-full border border-border px-5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading || totalCents === 0}
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating
            </>
          ) : (
            <>
              Create invoice
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </>
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

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          emphasize
            ? "font-display text-base"
            : "text-xs uppercase tracking-[0.15em] text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasize
            ? "font-display text-xl"
            : "font-mono text-xs text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
