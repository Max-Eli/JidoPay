"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Key, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<{ name: string; plaintext: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/api-keys");
      if (!res.ok) throw new Error("Failed to load API keys");
      const json = await res.json();
      setKeys(json.keys ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke the "${name}" API key? This cannot be undone — any integration using it will stop working immediately.`)) {
      return;
    }
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to revoke key");
      return;
    }
    toast.success("API key revoked");
    void load();
  };

  return (
    <div className="space-y-6">
      {revealed && (
        <KeyRevealBanner
          name={revealed.name}
          plaintext={revealed.plaintext}
          onDismiss={() => setRevealed(null)}
        />
      )}

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Credentials
            </p>
            <h2 className="mt-1 font-display text-lg">Your API keys</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Send these as <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">Authorization: Bearer jp_live_...</code> on requests to{" "}
              <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">POST /api/v1/checkout</code>. Keep them server-side — never embed in client code.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Create API key
          </button>
        </div>

        <div className="divide-y divide-border/60">
          {loading ? (
            <div className="flex items-center justify-center px-6 py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : keys.length === 0 ? (
            <EmptyState onCreate={() => setCreating(true)} />
          ) : (
            keys.map((k) => (
              <KeyRow key={k.id} apiKey={k} onRevoke={() => handleRevoke(k.id, k.name)} />
            ))
          )}
        </div>
      </section>

      <DocsSection />

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreated={(name, plaintext) => {
            setRevealed({ name, plaintext });
            setCreating(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function KeyRow({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: () => void }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
        <Key className="h-4 w-4 text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm">{apiKey.name}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          <code className="font-mono">{apiKey.prefix}…</code>
          <span>·</span>
          <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
          <span>·</span>
          <span>
            {apiKey.lastUsedAt
              ? `Last used ${new Date(apiKey.lastUsedAt).toLocaleDateString()}`
              : "Never used"}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRevoke}
        className="shrink-0 rounded-full border border-border/60 p-2 text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
        aria-label="Revoke key"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
        <Key className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-display text-lg">No API keys yet</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Create a key to call the JidoPay API from your own backend. You can bundle multiple products into one checkout session without pre-creating a payment link for every combo.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
      >
        <Plus className="h-3.5 w-3.5" />
        Create your first key
      </button>
    </div>
  );
}

function KeyRevealBanner({
  name,
  plaintext,
  onDismiss,
}: {
  name: string;
  plaintext: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm text-foreground">
            Copy your new API key now — you won&rsquo;t see it again
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This is the one and only time <span className="font-medium text-foreground">&ldquo;{name}&rdquo;</span> will be shown in plaintext. Store it in your server&rsquo;s secret manager.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-border/60 bg-background px-3 py-2.5 font-mono text-xs">
              {plaintext}
            </code>
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-medium transition-all hover:border-accent/60 hover:text-accent"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full border border-border/60 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (name: string, plaintext: string) => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create key");
      onCreated(json.key.name, json.key.plaintext);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg">Create API key</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/60 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production backend"
              maxLength={80}
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent/60"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              A short name so you can tell this key apart from others later.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocsSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Quick start
        </p>
        <h2 className="mt-1 font-display text-lg">Create a dynamic checkout</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Bundle any number of products into a single Stripe checkout session, on the fly. No pre-created payment links required.
        </p>
      </div>
      <div className="px-6 py-6">
        <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/20 p-4 font-mono text-[11px] leading-relaxed text-foreground">
{`curl -X POST https://jidopay.com/api/v1/checkout \\
  -H "Authorization: Bearer jp_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "line_items": [
      { "name": "IV Therapy Certification", "amount": 31016, "quantity": 1 },
      { "name": "NAD+ Masterclass", "amount": 36197, "quantity": 1 }
    ],
    "customer_email": "student@example.com",
    "client_reference_id": "user_abc123",
    "success_url": "https://yoursite.com/thanks",
    "cancel_url": "https://yoursite.com/checkout"
  }'`}
        </pre>
        <p className="mt-4 text-xs text-muted-foreground">
          Returns <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">{`{ id, url }`}</code>. Open the url in the JidoPay embed with{" "}
          <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">{`window.JidoPay.openCheckout({ url })`}</code>, or redirect your customer to it.
        </p>
      </div>
    </section>
  );
}
