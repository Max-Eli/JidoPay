import Link from "next/link";
import { Code2 } from "lucide-react";

export function EmbedSnippetButton({ linkId }: { linkId: string }) {
  return (
    <Link
      href={`/payment-links/${linkId}/embed`}
      title="Embed on website"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-accent/60 hover:text-accent"
    >
      <Code2 className="h-3.5 w-3.5" />
    </Link>
  );
}
