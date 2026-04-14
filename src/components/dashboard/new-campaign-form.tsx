"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  Mail,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Channel = "email" | "sms";
type Audience = "all" | "repeat" | "inactive" | "abandoned";

const AUDIENCE_OPTIONS: { value: Audience; label: string; hint: string }[] = [
  { value: "all", label: "All customers", hint: "Everyone who has paid you" },
  {
    value: "repeat",
    label: "Repeat buyers",
    hint: "Customers with 2 or more payments",
  },
  {
    value: "inactive",
    label: "Inactive",
    hint: "No activity in the last 30 days",
  },
  {
    value: "abandoned",
    label: "Abandoned checkouts",
    hint: "Left a checkout without paying",
  },
];

export function NewCampaignForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [audience, setAudience] = useState<Audience>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel,
          audience,
          subject: channel === "email" ? subject : undefined,
          body,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      router.push("/campaigns");
      router.refresh();
    } catch {
      setError("Failed to create campaign");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to campaigns
      </Link>

      {/* Channel */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Channel
          </p>
          <h2 className="mt-1 font-display text-lg">How do you want to reach them?</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <ChannelTile
            active={channel === "email"}
            icon={Mail}
            title="Email"
            description="Rich messages with a subject line."
            onClick={() => setChannel("email")}
          />
          <ChannelTile
            active={channel === "sms"}
            icon={MessageSquare}
            title="SMS"
            description="Text messages that get opened fast."
            onClick={() => setChannel("sms")}
          />
        </div>
      </section>

      {/* Audience */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Audience
          </p>
          <h2 className="mt-1 font-display text-lg">Who should receive this?</h2>
        </div>
        <div className="divide-y divide-border/60">
          {AUDIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAudience(opt.value)}
              className={cn(
                "flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors",
                audience === opt.value ? "bg-accent/5" : "hover:bg-muted/40"
              )}
            >
              <div>
                <p className="font-display text-base text-foreground">
                  {opt.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {opt.hint}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                  audience === opt.value
                    ? "border-accent bg-accent"
                    : "border-border"
                )}
              >
                {audience === opt.value && (
                  <span className="h-1.5 w-1.5 rounded-full bg-background" />
                )}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Content
          </p>
          <h2 className="mt-1 font-display text-lg">What do you want to say?</h2>
        </div>
        <div className="space-y-5 p-6">
          <Field label="Campaign name" required>
            <input
              type="text"
              required
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer re-engagement"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Only you see this. Customers won&apos;t.
            </p>
          </Field>

          {channel === "email" && (
            <Field label="Subject line" required>
              <input
                type="text"
                required
                maxLength={255}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="We miss you — 20% off your next order"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </Field>
          )}

          <Field
            label={channel === "email" ? "Body" : "Message"}
            required
            hint="Use {{name}} and {{business}} for personalization."
          >
            <textarea
              required
              rows={8}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                channel === "email"
                  ? "Hi {{name}}, it's been a while..."
                  : "Hi {{name}}, here's 20% off from {{business}} — use code BACK20"
              }
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
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
          href="/campaigns"
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
              Save as draft
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function ChannelTile({
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
