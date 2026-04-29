import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type GetStartedStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
};

export function GetStarted({ steps }: { steps: GetStartedStep[] }) {
  const completedCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const progressPct = Math.round((completedCount / total) * 100);
  const nextStep = steps.find((s) => !s.done);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="flex flex-col gap-4 border-b border-border/60 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Get started
          </p>
          <h2 className="mt-1 font-display text-xl">Set up your business</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount === 0
              ? "A few quick steps to start taking orders."
              : completedCount === total
              ? "All set. Your business is ready to take orders."
              : `${completedCount} of ${total} complete.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted md:w-40">
            <div
              className="h-full rounded-full bg-foreground transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {progressPct}%
          </span>
        </div>
      </div>

      <ol className="divide-y divide-border/60">
        {steps.map((step, idx) => {
          const isNext = step.id === nextStep?.id;
          const number = String(idx + 1).padStart(2, "0");
          return (
            <li
              key={step.id}
              className={cn(
                "flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:px-8",
                step.done && "bg-muted/20"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                  step.done
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-border/60 bg-background text-muted-foreground"
                )}
              >
                {step.done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="font-mono text-[11px]">{number}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-display text-base transition-colors",
                    step.done && "text-muted-foreground line-through"
                  )}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {!step.done && (
                <Link
                  href={step.href}
                  className={cn(
                    "group inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-4 py-2 text-xs font-medium transition-all md:self-auto",
                    isNext
                      ? "bg-foreground text-background hover:scale-[1.02] hover:bg-foreground/90"
                      : "border border-border/60 text-foreground hover:border-accent/60 hover:bg-muted"
                  )}
                >
                  {step.cta}
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
