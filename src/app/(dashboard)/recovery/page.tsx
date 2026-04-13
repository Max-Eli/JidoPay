import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, abandonedCheckouts, merchants } from "@/lib/db";
import { and, eq, desc, count, sum } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { Topbar } from "@/components/dashboard/topbar";
import { StatusPill } from "@/components/dashboard/status-pill";
import { FeatureToggle } from "@/components/dashboard/feature-toggle";
import { RemindButton } from "@/components/dashboard/remind-button";
import { Pagination, parsePageParam } from "@/components/dashboard/pagination";

export const metadata = { title: "Cart Recovery" };

const PAGE_SIZE = 25;

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const page = parsePageParam(params.page);
  const offset = (page - 1) * PAGE_SIZE;

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));
  if (!merchant) redirect("/sign-in");

  // Stats are computed via aggregate queries across the full table —
  // never across the paginated window — so the dashboard numbers stay
  // accurate even when the list paginates.
  const [list, [totalRow], [pendingAgg], [recoveredAgg]] = await Promise.all([
    db
      .select()
      .from(abandonedCheckouts)
      .where(eq(abandonedCheckouts.merchantId, userId))
      .orderBy(desc(abandonedCheckouts.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(abandonedCheckouts)
      .where(eq(abandonedCheckouts.merchantId, userId)),
    db
      .select({ total: sum(abandonedCheckouts.amount) })
      .from(abandonedCheckouts)
      .where(
        and(
          eq(abandonedCheckouts.merchantId, userId),
          eq(abandonedCheckouts.status, "pending")
        )
      ),
    db
      .select({ total: sum(abandonedCheckouts.amount) })
      .from(abandonedCheckouts)
      .where(
        and(
          eq(abandonedCheckouts.merchantId, userId),
          eq(abandonedCheckouts.status, "recovered")
        )
      ),
  ]);

  const total = totalRow?.count ?? 0;
  const pendingValue = Number(pendingAgg?.total ?? 0);
  const recoveredValue = Number(recoveredAgg?.total ?? 0);

  return (
    <>
      <Topbar
        title="Cart recovery"
        description="Win back customers who didn't finish checking out."
      />

      <div className="mx-auto max-w-7xl space-y-6 px-8 py-10">
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Feature
              </p>
              <h2 className="mt-1 font-display text-lg">Abandoned cart SMS</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                When a customer leaves checkout without paying, we capture their
                details so you can send a reminder by SMS or email.
              </p>
            </div>
            <FeatureToggle
              flag="abandonedRecoveryEnabled"
              initial={merchant.abandonedRecoveryEnabled}
              label="Enable recovery"
            />
          </div>

          <div className="grid grid-cols-3 divide-x divide-border/60">
            <Stat label="Pending value" value={formatCurrency(pendingValue)} />
            <Stat label="Recovered" value={formatCurrency(recoveredValue)} />
            <Stat label="Total checkouts" value={total.toString()} />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Queue
            </p>
            <h2 className="mt-1 font-display text-lg">
              Abandoned checkouts
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {total}
              </span>
            </h2>
          </div>

          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-display text-lg">No abandoned checkouts</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                When a customer leaves a payment link session, it'll appear here
                automatically.
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/60">
                {list.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate font-display text-lg">
                          {row.customerName ?? row.customerEmail ?? "Anonymous"}
                        </p>
                        <StatusPill status={row.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        <span className="text-foreground">
                          {formatCurrency(row.amount, row.currency)}
                        </span>
                        {row.customerEmail && <span>{row.customerEmail}</span>}
                        {row.customerPhone && <span>{row.customerPhone}</span>}
                        <span>Left {formatDate(row.createdAt)}</span>
                      </div>
                    </div>
                    {row.status === "pending" && <RemindButton id={row.id} />}
                  </li>
                ))}
              </ul>
              <Pagination
                basePath="/recovery"
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}
