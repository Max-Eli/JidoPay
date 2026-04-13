import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, payments } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import { Topbar } from "@/components/dashboard/topbar";
import { StatusPill } from "@/components/dashboard/status-pill";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const allPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.merchantId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(100);

  return (
    <>
      <Topbar
        title="Payments"
        description="Every transaction processed through your account."
      />

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Ledger
              </p>
              <h2 className="mt-1 font-display text-lg">
                All payments
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {allPayments.length}
                </span>
              </h2>
            </div>
          </div>

          {allPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Transactions will appear here as your customers pay."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left">
                    <Th>Customer</Th>
                    <Th>Amount</Th>
                    <Th>Platform fee</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th>Description</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {allPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <Td>
                        <p className="font-medium">
                          {payment.customerName ?? "Anonymous"}
                        </p>
                        {payment.customerEmail && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {payment.customerEmail}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <span className="font-display text-base">
                          {formatCurrency(payment.amount, payment.currency)}
                        </span>
                      </Td>
                      <Td className="text-muted-foreground">
                        {formatCurrency(
                          payment.applicationFee,
                          payment.currency
                        )}
                      </Td>
                      <Td>
                        <StatusPill status={payment.status} />
                      </Td>
                      <Td className="font-mono text-xs text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </Td>
                      <Td className="max-w-[200px] truncate text-muted-foreground">
                        {payment.description ?? "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-display text-lg">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
