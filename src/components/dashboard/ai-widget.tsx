"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export function AiWidget() {
  const pathname = usePathname();

  // Don't render the floating launcher on the AI page itself.
  if (pathname?.startsWith("/ai")) return null;

  return (
    <Link
      href="/ai"
      aria-label="Open AI assistant"
      className="group fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2.5 rounded-full border border-border/60 bg-card px-5 text-sm font-medium text-foreground shadow-[0_18px_60px_-18px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:scale-[1.03] hover:border-accent/60"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-accent/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"
      />
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Sparkles className="h-4 w-4" />
      </span>
      Ask JidoPay
    </Link>
  );
}
