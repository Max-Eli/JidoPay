import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, merchants, payments, invoices, customers } from "@/lib/db";
import { eq, and, gte, sum, count, desc } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  CreditCard,
  FileText,
  Users,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { OnboardingBanner } from "@/components/dashboard/onboarding-banner";
import { Topbar } from "@/components/dashboard/topbar";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) redirect("/sign-in");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [revenueResult] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(eq(payments.merchantId, userId), eq(payments.status, "succeeded"))
    );

  const [monthlyRevenueResult] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(
        eq(payments.merchantId, userId),
        eq(payments.status, "succeeded"),
        gte(payments.createdAt, thirtyDaysAgo)
      )
    );

  const [paymentCountResult] = await db
    .select({ count: count() })
    .from(payments)
    .where(
      and(eq(payments.merchantId, userId), eq(payments.status, "succeeded"))
    );

  const [invoiceCountResult] = await db
    .select({ count: count() })
    .from(invoices)
    .where(and(eq(invoices.merchantId, userId), eq(invoices.status, "sent")));

  const [customerCountResult] = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.merchantId, userId));

  const recentPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.merchantId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(5);

  const outstandingInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.merchantId, userId), eq(invoices.status, "sent")))
    .orderBy(desc(invoices.createdAt))
    .limit(5);

  const totalRevenue = Number(revenueResult?.total ?? 0);
  const monthlyRevenue = Number(monthlyRevenueResult?.total ?? 0);
  const totalPayments = paymentCountResult?.count ?? 0;
  const pendingInvoices = invoiceCountResult?.count ?? 0;
  const totalCustomers = customerCountResult?.count ?? 0;

  const STATS = [
    {
      label: "Total revenue",
      value: formatCurrency(totalRevenue),
      sub: `${formatCurrency(monthlyRevenue)} in the last 30 days`,
      icon: TrendingUp,
    },
    {
      label: "Successful payments",
      value: totalPayments.toLocaleString(),
      sub: "All-time transactions",
      icon: CreditCard,
    },
    {
      label: "Outstanding invoices",
      value: pendingInvoices.toLocaleString(),
      sub: "Awaiting payment",
      icon: FileText,
    },
    {
      label: "Customers",
      value: totalCustomers.toLocaleString(),
      sub: "All time",
      icon: Users,
    },
  ];

  return (
    <>
      <Topbar
        title="Dashboard"
        description="A snapshot of your revenue, payments, and customer activity."
      />

      <div className="mx-auto max-w-7xl space-y-10 px-8 py-10">
        {!merchant.stripeOnboardingComplete && <OnboardingBanner />}

        {/* Stats */}
        <section>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="group relative bg-card p-6 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <stat.icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
                </div>
                <p className="mt-5 font-display text-4xl leading-none">
                  {stat.value}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Recent payments */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Activity
                </p>
                <h2 className="mt-1 font-display text-lg">Recent payments</h2>
              </div>
              <Link
                href="/payments"
                className="group inline-flex items-center gap-1 text-xs font-medium text-accent"
              >
                View all
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No payments yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a payment link to start getting paid.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {payment.customerName ?? "Anonymous"}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1.5">
                      <p className="font-display text-base">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <StatusPill status={payment.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Outstanding invoices */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Receivables
                </p>
                <h2 className="mt-1 font-display text-lg">
                  Outstanding invoices
                </h2>
              </div>
              <Link
                href="/invoices"
                className="group inline-flex items-center gap-1 text-xs font-medium text-accent"
              >
                View all
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
            {outstandingInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">All caught up</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No invoices are awaiting payment.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {outstandingInvoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {invoice.customerName}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {invoice.invoiceNumber}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1.5">
                      <p className="font-display text-base">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </p>
                      {invoice.dueDate && (
                        <p className="flex items-center gap-1 text-[11px] text-amber-500">
                          <AlertCircle className="h-3 w-3" />
                          Due {formatDate(invoice.dueDate)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    succeeded:
      "bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20",
    failed:
      "bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/20",
    pending:
      "bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        styles[status] ?? styles.pending
      }`}
    >
      {status}
    </span>
  );
}
