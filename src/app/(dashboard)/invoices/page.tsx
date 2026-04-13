import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, invoices } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Pagination, parsePageParam } from "@/components/dashboard/pagination";

export const metadata = { title: "Invoices" };

const PAGE_SIZE = 25;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const page = parsePageParam(params.page);
  const offset = (page - 1) * PAGE_SIZE;

  const [allInvoices, [totalRow]] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(eq(invoices.merchantId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.merchantId, userId)),
  ]);

  const total = totalRow?.count ?? 0;

  return (
    <>
      <Topbar
        title="Invoices"
        description="Create and send professional invoices to your customers."
        actions={
          <Link
            href="/invoices/new"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New invoice
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Receivables
              </p>
              <h2 className="mt-1 font-display text-lg">
                All invoices
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {total}
                </span>
              </h2>
            </div>
          </div>

          {allInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-display text-lg">No invoices yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first invoice to start getting paid.
              </p>
              <Link
                href="/invoices/new"
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
              >
                Create invoice
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-left">
                      <Th>Invoice</Th>
                      <Th>Customer</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Due</Th>
                      <Th>Created</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {allInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="cursor-pointer transition-colors hover:bg-muted/30"
                      >
                        <Td className="font-mono text-xs text-muted-foreground">
                          {invoice.invoiceNumber}
                        </Td>
                        <Td>
                          <p className="font-medium">{invoice.customerName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {invoice.customerEmail}
                          </p>
                        </Td>
                        <Td>
                          <span className="font-display text-base">
                            {formatCurrency(
                              invoice.totalAmount,
                              invoice.currency
                            )}
                          </span>
                        </Td>
                        <Td>
                          <StatusPill status={invoice.status} />
                        </Td>
                        <Td className="font-mono text-xs text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </Td>
                        <Td className="font-mono text-xs text-muted-foreground">
                          {formatDate(invoice.createdAt)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                basePath="/invoices"
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>;
}
