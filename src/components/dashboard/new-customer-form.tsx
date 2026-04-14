"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";

export function NewCustomerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          address: address || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to add customer");
        setLoading(false);
        return;
      }
      router.push("/customers");
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to customers
      </Link>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Customer
          </p>
          <h2 className="mt-1 font-display text-lg">Contact details</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
          <Field label="Full name" required>
            <input
              type="text"
              required
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Cooper"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              maxLength={50}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <textarea
                rows={3}
                maxLength={500}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Optional billing address"
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </Field>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/customers"
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
              Saving
            </>
          ) : (
            <>
              Add customer
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
