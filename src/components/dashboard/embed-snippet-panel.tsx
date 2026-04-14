"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function EmbedSnippetPanel({ linkId }: { linkId: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://jidopay.com";

  const scriptSnippet = `<script src="${origin}/embed.js" async></script>`;
  const buttonSnippet = `<button data-jidopay="${linkId}">Pay with JidoPay</button>`;
  const fullSnippet = `${scriptSnippet}\n${buttonSnippet}`;

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-5">
      <SnippetBlock
        label="1. Script tag"
        value={scriptSnippet}
        copied={copiedKey === "script"}
        onCopy={() => copy(scriptSnippet, "script")}
      />
      <SnippetBlock
        label="2. Button element"
        value={buttonSnippet}
        copied={copiedKey === "button"}
        onCopy={() => copy(buttonSnippet, "button")}
      />

      <button
        type="button"
        onClick={() => copy(fullSnippet, "full")}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-all hover:scale-[1.01] hover:bg-foreground/90"
      >
        {copiedKey === "full" ? (
          <>
            <Check className="h-4 w-4" />
            Copied both lines
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy full snippet
          </>
        )}
      </button>
    </div>
  );
}

function SnippetBlock({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-muted/30">
        <pre className="overflow-x-auto px-4 py-3 pr-12 font-mono text-xs leading-relaxed text-foreground">
          {value}
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-all hover:border-accent/60 hover:text-accent"
          aria-label="Copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
