"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Zap,
  AlertCircle,
  CircleCheck,
  CircleDot,
  Clock,
  Repeat,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";

const ALL_EVENTS = [
  { value: "payment.succeeded", label: "Payment succeeded", hint: "Customer paid successfully" },
  { value: "payment.failed", label: "Payment failed", hint: "Card declined or bank error" },
  { value: "payment.refunded", label: "Payment refunded", hint: "Full or partial refund issued" },
  { value: "payment_link.created", label: "Payment link created", hint: "A new link was created" },
  { value: "checkout.session.completed", label: "Checkout completed", hint: "First fireable event after payment — usually best for grant-access flows" },
  { value: "checkout.session.expired", label: "Checkout expired", hint: "Session expired without payment" },
  { value: "subscription.created", label: "Subscription created", hint: "New recurring plan started" },
  { value: "subscription.canceled", label: "Subscription canceled", hint: "Recurring plan ended" },
] as const;

type EventValue = (typeof ALL_EVENTS)[number]["value"];

type Webhook = {
  id: string;
  merchantId: string;
  url: string;
  description: string | null;
  enabledEvents: string[];
  active: boolean;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: string | null;
  signingSecretHint: string;
  createdAt: string;
  updatedAt: string;
};

type Delivery = {
  id: string;
  webhookId: string;
  event: string;
  eventId: string;
  payload: string;
  status: "pending" | "delivered" | "failed" | "retrying";
  attempts: number;
  responseCode: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  nextRetryAt: string | null;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revealSecret, setRevealSecret] = useState<{
    id: string;
    secret: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant-webhooks");
      if (!res.ok) throw new Error("Failed to load webhooks");
      const json = await res.json();
      setWebhooks(json.webhooks ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      {revealSecret && (
        <SecretRevealBanner
          secret={revealSecret.secret}
          onDismiss={() => setRevealSecret(null)}
        />
      )}

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Endpoints
            </p>
            <h2 className="mt-1 font-display text-lg">Your webhook endpoints</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              We deliver a signed HTTPS POST to each endpoint for every matching
              event. Requests are retried on 5xx and timeouts with exponential
              backoff for up to 12 hours.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add endpoint
          </button>
        </div>

        <div className="divide-y divide-border/60">
          {loading ? (
            <div className="flex items-center justify-center px-6 py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : webhooks.length === 0 ? (
            <EmptyState onCreate={() => setCreating(true)} />
          ) : (
            webhooks.map((w) => (
              <WebhookRow
                key={w.id}
                webhook={w}
                onRefresh={load}
                onSecretRotated={(secret) =>
                  setRevealSecret({ id: w.id, secret })
                }
              />
            ))
          )}
        </div>
      </section>

      <SignatureDocs />

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreated={(secret) => {
            setRevealSecret({ id: "new", secret });
            setCreating(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
        <Zap className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-display text-lg">No webhook endpoints yet</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Add an endpoint on your server to receive signed notifications whenever
        something happens on your JidoPay account.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
      >
        <Plus className="h-3.5 w-3.5" />
        Add your first endpoint
      </button>
    </div>
  );
}

function WebhookRow({
  webhook,
  onRefresh,
  onSecretRotated,
}: {
  webhook: Webhook;
  onRefresh: () => void;
  onSecretRotated: (secret: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleActive() {
    setBusy("toggle");
    try {
      const res = await fetch(`/api/merchant-webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !webhook.active }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(webhook.active ? "Endpoint disabled" : "Endpoint enabled");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setBusy("test");
    try {
      const res = await fetch(`/api/merchant-webhooks/${webhook.id}/test`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Test send failed");
      toast.success("Test event dispatched — check the deliveries log");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test send failed");
    } finally {
      setBusy(null);
    }
  }

  async function rotateSecret() {
    if (
      !confirm(
        "Rotate the signing secret?\n\nYour old secret will stop working immediately. Make sure you update your server with the new secret right after."
      )
    )
      return;
    setBusy("rotate");
    try {
      const res = await fetch(`/api/merchant-webhooks/${webhook.id}/rotate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Rotate failed");
      const json = await res.json();
      onSecretRotated(json.signingSecret);
      toast.success("Signing secret rotated");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (
      !confirm(
        "Delete this webhook endpoint?\n\nFuture events will no longer be delivered here. Past delivery history will also be removed."
      )
    )
      return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/merchant-webhooks/${webhook.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Endpoint deleted");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusDot
              status={webhook.active ? webhook.lastDeliveryStatus : "disabled"}
            />
            <code className="break-all font-mono text-sm text-foreground">
              {webhook.url}
            </code>
          </div>
          {webhook.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {webhook.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-border/60 px-2 py-0.5 font-mono">
              {webhook.signingSecretHint}
            </span>
            <span>·</span>
            <span>
              {webhook.enabledEvents.length === 0
                ? "All events"
                : `${webhook.enabledEvents.length} event${
                    webhook.enabledEvents.length === 1 ? "" : "s"
                  }`}
            </span>
            {webhook.lastDeliveryAt && (
              <>
                <span>·</span>
                <span>
                  Last delivery{" "}
                  {new Date(webhook.lastDeliveryAt).toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <IconButton
            onClick={sendTest}
            loading={busy === "test"}
            label="Send test"
            icon={<Send className="h-3.5 w-3.5" />}
          />
          <IconButton
            onClick={toggleActive}
            loading={busy === "toggle"}
            label={webhook.active ? "Disable" : "Enable"}
            icon={<CircleDot className="h-3.5 w-3.5" />}
          />
          <IconButton
            onClick={rotateSecret}
            loading={busy === "rotate"}
            label="Rotate secret"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          />
          <IconButton
            onClick={remove}
            loading={busy === "delete"}
            label="Delete"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            danger
          />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
          >
            {expanded ? "Hide deliveries" : "Show deliveries"}
          </button>
        </div>
      </div>

      {expanded && <DeliveriesLog webhookId={webhook.id} />}
    </div>
  );
}

function IconButton({
  onClick,
  loading,
  label,
  icon,
  danger,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-60 ${
        danger
          ? "border-border/60 text-muted-foreground hover:border-red-500/60 hover:text-red-500"
          : "border-border/60 text-muted-foreground hover:border-accent/60 hover:text-accent"
      }`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function StatusDot({ status }: { status: string | null }) {
  if (status === "disabled") {
    return (
      <span
        className="inline-flex h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40"
        title="Disabled"
      />
    );
  }
  if (status === "delivered") {
    return (
      <span
        className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500"
        title="Last delivery succeeded"
      />
    );
  }
  if (status === "failed") {
    return (
      <span
        className="inline-flex h-2 w-2 shrink-0 rounded-full bg-red-500"
        title="Last delivery failed"
      />
    );
  }
  if (status === "retrying") {
    return (
      <span
        className="inline-flex h-2 w-2 shrink-0 rounded-full bg-amber-500"
        title="Retrying"
      />
    );
  }
  return (
    <span
      className="inline-flex h-2 w-2 shrink-0 rounded-full border border-border/60"
      title="No deliveries yet"
    />
  );
}

function DeliveriesLog({ webhookId }: { webhookId: string }) {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/merchant-webhooks/${webhookId}/deliveries?limit=25`
      );
      if (!res.ok) throw new Error("Failed to load deliveries");
      const json = await res.json();
      setDeliveries(json.deliveries ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    }
  }, [webhookId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function replay(deliveryId: string) {
    setReplayingId(deliveryId);
    try {
      const res = await fetch(
        `/api/merchant-webhooks/${webhookId}/deliveries/${deliveryId}/replay`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Replay failed");
      toast.success("Replay triggered");
      setTimeout(() => void load(), 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Replay failed");
    } finally {
      setReplayingId(null);
    }
  }

  if (deliveries === null) {
    return (
      <div className="mt-4 flex items-center justify-center rounded-xl border border-border/60 bg-muted/20 px-6 py-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading deliveries…
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 px-6 py-6 text-center text-sm text-muted-foreground">
        No deliveries yet. Send a test event to see how it looks.
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Recent deliveries
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Refresh
        </button>
      </div>
      <ul className="divide-y divide-border/60">
        {deliveries.map((d) => (
          <li key={d.id} className="text-xs">
            <button
              type="button"
              onClick={() =>
                setExpandedId(expandedId === d.id ? null : d.id)
              }
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <DeliveryStatusIcon status={d.status} />
              <span className="font-mono text-muted-foreground">
                {d.event}
              </span>
              <span className="flex-1 truncate font-mono text-muted-foreground/70">
                {d.eventId}
              </span>
              <span className="font-mono text-muted-foreground">
                {d.responseCode ?? "—"}
              </span>
              <span className="text-muted-foreground">
                {new Date(d.createdAt).toLocaleTimeString()}
              </span>
            </button>

            {expandedId === d.id && (
              <div className="space-y-3 border-t border-border/60 bg-background/40 px-4 py-3">
                <DetailRow label="Status" value={d.status} />
                <DetailRow label="Attempts" value={String(d.attempts)} />
                {d.responseCode !== null && (
                  <DetailRow
                    label="Response"
                    value={`HTTP ${d.responseCode}`}
                  />
                )}
                {d.errorMessage && (
                  <DetailRow label="Error" value={d.errorMessage} mono />
                )}
                {d.nextRetryAt && d.status === "retrying" && (
                  <DetailRow
                    label="Next retry"
                    value={new Date(d.nextRetryAt).toLocaleString()}
                  />
                )}
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Payload
                  </p>
                  <pre className="max-h-52 overflow-auto rounded-lg border border-border/60 bg-background p-3 font-mono text-[11px] leading-relaxed">
                    {formatJson(d.payload)}
                  </pre>
                </div>
                {d.responseBody && (
                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                      Response body
                    </p>
                    <pre className="max-h-40 overflow-auto rounded-lg border border-border/60 bg-background p-3 font-mono text-[11px] leading-relaxed">
                      {d.responseBody}
                    </pre>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => replay(d.id)}
                  disabled={replayingId === d.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-60"
                >
                  {replayingId === d.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Repeat className="h-3 w-3" />
                  )}
                  Replay
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span
        className={`break-all text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function DeliveryStatusIcon({ status }: { status: Delivery["status"] }) {
  if (status === "delivered")
    return <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />;
  if (status === "failed")
    return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  if (status === "retrying")
    return <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />;
  return <CircleDot className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (secret: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<EventValue>>(new Set());
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/merchant-webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          description: description.trim() || undefined,
          enabledEvents: Array.from(selected),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Create failed");
      }
      toast.success("Endpoint created");
      onCreated(json.signingSecret);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card"
      >
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            New endpoint
          </p>
          <h2 className="mt-1 font-display text-lg">Add a webhook endpoint</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the URL on your server that should receive signed events.
            We&apos;ll generate a signing secret you can copy once.
          </p>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Endpoint URL
            </label>
            <input
              type="url"
              required
              placeholder="https://yourdomain.com/api/jidopay/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 font-mono text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Description (optional)
            </label>
            <input
              type="text"
              placeholder="Production LMS server"
              maxLength={160}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Events to receive
            </label>
            <p className="mb-3 text-xs text-muted-foreground">
              Leave everything unchecked to receive all current and future events.
            </p>
            <div className="space-y-2">
              {ALL_EVENTS.map((ev) => {
                const checked = selected.has(ev.value);
                return (
                  <label
                    key={ev.value}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:border-accent/60"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = new Set(selected);
                        if (next.has(ev.value)) next.delete(ev.value);
                        else next.add(ev.value);
                        setSelected(next);
                      }}
                      className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-foreground">
                        {ev.value}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {ev.hint}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Create endpoint
          </button>
        </div>
      </form>
    </div>
  );
}

function SecretRevealBanner({
  secret,
  onDismiss,
}: {
  secret: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base">Signing secret — shown once</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy this secret into your server&apos;s environment variables now.
            You won&apos;t see it again. If you lose it, rotate to generate a
            new one.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2.5">
            <code className="min-w-0 flex-1 break-all font-mono text-xs">
              {visible ? secret : "whsec_" + "•".repeat(Math.max(0, secret.length - 6))}
            </code>
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="shrink-0 rounded-lg border border-border/60 p-1.5 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
              title={visible ? "Hide" : "Show"}
            >
              {visible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-lg border border-border/60 p-1.5 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
              title="Copy"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              I&apos;ve saved it — dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignatureDocs() {
  const [copied, setCopied] = useState(false);
  const nodeSnippet = useMemo(
    () => `import crypto from "crypto";

// In your webhook handler (e.g. Express / Next.js route):
const signature = req.headers["jidopay-signature"];
const body = rawRequestBody; // raw string — NOT the parsed JSON
const secret = process.env.JIDOPAY_WEBHOOK_SECRET;

const [tsPart, sigPart] = signature.split(",");
const timestamp = Number(tsPart.split("=")[1]);
const expected = crypto
  .createHmac("sha256", secret)
  .update(\`\${timestamp}.\${body}\`)
  .digest("hex");

if (sigPart.split("=")[1] !== expected) {
  return res.status(400).send("Invalid signature");
}
if (Math.abs(Date.now() / 1000 - timestamp) > 300) {
  return res.status(400).send("Timestamp outside tolerance");
}

// Signature is valid — parse and handle the event
const event = JSON.parse(body);
`,
    []
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(nodeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Verifying signatures
        </p>
        <h2 className="mt-1 font-display text-lg">How to verify requests</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Every request includes a{" "}
          <code className="font-mono text-xs">Jidopay-Signature</code> header
          in the format{" "}
          <code className="font-mono text-xs">t=&lt;unix&gt;,v1=&lt;hmac&gt;</code>.
          Compute an HMAC-SHA256 of{" "}
          <code className="font-mono text-xs">&lt;timestamp&gt;.&lt;body&gt;</code>{" "}
          using your signing secret and compare.
        </p>
      </div>
      <div className="relative px-6 py-5">
        <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-[11px] leading-relaxed">
          {nodeSnippet}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="absolute right-8 top-7 rounded-lg border border-border/60 bg-card p-1.5 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
          title="Copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </section>
  );
}
