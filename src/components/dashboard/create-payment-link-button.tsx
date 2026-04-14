import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatePaymentLinkButtonProps {
  className?: string;
  variant?: "solid" | "ghost";
}

export function CreatePaymentLinkButton({
  className,
  variant = "solid",
}: CreatePaymentLinkButtonProps) {
  return (
    <Link
      href="/payment-links/new"
      className={cn(
        "group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium transition-all hover:scale-[1.02]",
        variant === "solid"
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "border border-border text-foreground hover:bg-muted",
        className
      )}
    >
      <Plus className="h-3.5 w-3.5" />
      New link
    </Link>
  );
}
