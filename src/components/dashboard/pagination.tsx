import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  /** Extra search params to preserve across page links. */
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({
  basePath,
  page,
  pageSize,
  total,
  searchParams = {},
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  function hrefFor(next: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") params.set(key, value);
    }
    if (next > 1) params.set("page", String(next));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 text-xs text-muted-foreground">
      <span className="font-mono uppercase tracking-wider">
        {start.toLocaleString()}–{end.toLocaleString()} of{" "}
        {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <PageLink
          href={hrefFor(page - 1)}
          disabled={prevDisabled}
          label="Previous"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </PageLink>
        <span className="font-mono uppercase tracking-wider">
          Page {page} / {totalPages}
        </span>
        <PageLink href={hrefFor(page + 1)} disabled={nextDisabled} label="Next">
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium transition-colors";
  if (disabled) {
    return (
      <span
        aria-disabled
        aria-label={`${label} (disabled)`}
        className={cn(base, "cursor-not-allowed opacity-40")}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(base, "hover:border-accent/60 hover:text-foreground")}
    >
      {children}
    </Link>
  );
}

export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(value ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 10_000);
}
