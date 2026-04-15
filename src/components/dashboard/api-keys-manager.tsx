"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Copy, Key, Loader2, Plus, ShieldCheck, Trash2, X } from "lucide-react";
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
        <KeyRevealDialog
          name={revealed.name}
          plaintext={revealed.plaintext}
          onAcknowledge={() => setRevealed(null)}
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

// Full-screen, blocking reveal modal. Modeled after Stripe / Vercel / AWS:
// the plaintext key is shown exactly once, the user can't close the dialog
// without explicitly acknowledging, and the secret lives in a readonly
// <input> so "just select the text" always works even if the clipboard
// permission is blocked.
function KeyRevealDialog({
  name,
  plaintext,
  onAcknowledge,
}: {
  name: string;
  plaintext: string;
  onAcknowledge: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-select the plaintext so Cmd-C / Ctrl-C works the instant the
    // modal appears, even before the user notices the Copy button.
    inputRef.current?.select();
  }, []);

  const copy = async () => {
    try {
      // Modern clipboard API — only works in secure (HTTPS) contexts.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plaintext);
      } else {
        // Legacy execCommand fallback for dev/http and locked-down browsers.
        inputRef.current?.select();
        document.execCommand("copy");
      }
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Even if both copy paths fail the text is still selected and
      // visible — instruct the user to copy manually rather than losing it.
      inputRef.current?.select();
      toast.error("Couldn't copy automatically — press Cmd/Ctrl+C to copy");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-reveal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl rounded-2xl border border-accent/40 bg-card p-7 shadow-2xl">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="api-key-reveal-title"
              className="font-display text-xl text-foreground"
            >
              Copy your new API key
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This is the only time <span className="font-semibold text-foreground">&ldquo;{name}&rdquo;</span> will be shown. Store it in a secret manager before closing this dialog — we only keep a hash, so there is no way to retrieve it later.
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <label
            htmlFor="api-key-reveal-input"
            className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Secret key
          </label>
          <div className="flex items-stretch gap-2">
            <input
              id="api-key-reveal-input"
              ref={inputRef}
              readOnly
              value={plaintext}
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-accent/60"
              aria-label="API key plaintext"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-background px-5 text-sm font-medium transition-all hover:border-accent/60 hover:text-accent"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tip: click the field to select the full key, then press{" "}
            <kbd className="rounded border border-border/60 bg-muted/40 px-1 font-mono text-[10px]">
              ⌘C
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-border/60 bg-muted/40 px-1 font-mono text-[10px]">
              Ctrl+C
            </kbd>
            .
          </p>
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Treat this like a password.</span>{" "}
            Never embed it in frontend code, commit it to git, or share it in Slack. If it leaks, revoke it from this page and create a new one.
          </div>
        </div>

        <label className="mb-4 flex cursor-pointer select-none items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-accent"
          />
          <span className="text-foreground">
            I&rsquo;ve copied and stored this key somewhere safe. I understand it won&rsquo;t be shown again.
          </span>
        </label>

        <button
          type="button"
          disabled={!acknowledged}
          onClick={onAcknowledge}
          className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-all hover:scale-[1.01] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          Done — close this dialog
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
