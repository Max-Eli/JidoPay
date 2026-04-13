import { cn } from "@/lib/utils";

type Tone = "success" | "danger" | "warning" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  success:
    "bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20",
  danger: "bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/20",
  warning:
    "bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20",
  info: "bg-accent/10 text-accent ring-1 ring-inset ring-accent/20",
  neutral:
    "bg-muted text-muted-foreground ring-1 ring-inset ring-border/60",
};

const STATUS_TONE: Record<string, Tone> = {
  succeeded: "success",
  paid: "success",
  active: "success",
  enabled: "success",
  complete: "success",
  recovered: "success",
  failed: "danger",
  overdue: "danger",
  disputed: "danger",
  void: "danger",
  pending: "warning",
  sending: "warning",
  reminded: "info",
  sent: "info",
  viewed: "info",
  refunded: "info",
  draft: "neutral",
  inactive: "neutral",
  disabled: "neutral",
  dismissed: "neutral",
};

interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const tone = STATUS_TONE[status.toLowerCase()] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        TONES[tone],
        className
      )}
    >
      {status}
    </span>
  );
}
