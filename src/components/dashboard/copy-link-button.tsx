"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={copy}
      title="Copy link"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-accent/60 hover:text-accent"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
