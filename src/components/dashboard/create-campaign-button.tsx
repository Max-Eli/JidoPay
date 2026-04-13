"use client";

import { useState } from "react";
import { Plus, Loader2, X, ArrowUpRight, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Channel = "email" | "sms";
type Audience = "all" | "repeat" | "inactive" | "abandoned";

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "All customers",
  repeat: "Repeat buyers (2+ payments)",
  inactive: "Inactive (30+ days)",
  abandoned: "Abandoned checkouts",
};

export function CreateCampaignButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<{
    name: string;
    channel: Channel;
    audience: Audience;
    subject: string;
    body: string;
  }>({
    name: "",
    channel: "email",
    audience: "all",
    subject: "",
    body: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          channel: form.channel,
          audience: form.audience,
          subject: form.channel === "email" ? form.subject : undefined,
          body: form.body,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      setOpen(false);
      setForm({
        name: "",
        channel: "email",
        audience: "all",
        subject: "",
        body: "",
      });
      window.location.reload();
    } catch {
      setError("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
      >
        <Plus className="h-3.5 w-3.5" />
        New campaign
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-card p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.4)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-32 -top-32 h-60 w-60 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative mb-6 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Retargeting
                </p>
                <h2 className="mt-1 font-display text-2xl">New campaign</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-5">
              <Field label="Name" required>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer re-engagement"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </Field>

              <Field label="Channel" required>
                <div className="grid grid-cols-2 gap-2">
                  <ChannelTile
                    active={form.channel === "email"}
                    icon={Mail}
                    label="Email"
                    onClick={() => setForm({ ...form, channel: "email" })}
                  />
                  <ChannelTile
                    active={form.channel === "sms"}
                    icon={MessageSquare}
                    label="SMS"
                    onClick={() => setForm({ ...form, channel: "sms" })}
                  />
                </div>
              </Field>

              <Field label="Audience" required>
                <select
                  value={form.audience}
                  onChange={(e) =>
                    setForm({ ...form, audience: e.target.value as Audience })
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              {form.channel === "email" && (
                <Field label="Subject" required>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                    placeholder="We miss you — 20% off your next order"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </Field>
              )}

              <Field
                label={form.channel === "email" ? "Body" : "Message"}
                required
                hint="Use {{name}} and {{business}} for personalization."
              >
                <textarea
                  required
                  rows={5}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder={
                    form.channel === "email"
                      ? "Hi {{name}}, it's been a while..."
                      : "Hi {{name}}, here's 20% off from {{business}} — use code BACK20"
                  }
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
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
                  className="group flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      Save as draft
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </>
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

function ChannelTile({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
        active
          ? "border-accent bg-accent/10 text-foreground"
          : "border-border bg-background text-muted-foreground hover:border-accent/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4", active && "text-accent")} />
      {label}
    </button>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
