import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, customers } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users } from "lucide-react";
import { Topbar } from "@/components/dashboard/topbar";
import { Pagination, parsePageParam } from "@/components/dashboard/pagination";

export const metadata = { title: "Customers" };

const PAGE_SIZE = 25;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const page = parsePageParam(params.page);
  const offset = (page - 1) * PAGE_SIZE;

  const [allCustomers, [totalRow]] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(eq(customers.merchantId, userId))
      .orderBy(desc(customers.totalSpend))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.merchantId, userId)),
  ]);

  const total = totalRow?.count ?? 0;

  return (
    <>
      <Topbar
        title="Customers"
        description="Everyone who has paid you through JidoPay, ranked by lifetime value."
      />

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Directory
              </p>
              <h2 className="mt-1 font-display text-lg">
                All customers
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {total}
                </span>
              </h2>
            </div>
          </div>

          {allCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-display text-lg">No customers yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Customers appear automatically once they pay you.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-left">
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Lifetime value</Th>
                      <Th>Payments</Th>
                      <Th>First seen</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {allCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40 font-display text-sm">
                              {customer.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <p className="font-medium">{customer.name}</p>
                          </div>
                        </Td>
                        <Td className="text-muted-foreground">
                          {customer.email}
                        </Td>
                        <Td>
                          <span className="font-display text-base">
                            {formatCurrency(customer.totalSpend)}
                          </span>
                        </Td>
                        <Td className="font-mono text-xs text-muted-foreground">
                          {customer.paymentCount}
                        </Td>
                        <Td className="font-mono text-xs text-muted-foreground">
                          {formatDate(customer.createdAt)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                basePath="/customers"
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
