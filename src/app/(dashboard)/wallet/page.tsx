import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, wallets, customers, merchants } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet as WalletIcon } from "lucide-react";
import { Topbar } from "@/components/dashboard/topbar";
import { FeatureToggle } from "@/components/dashboard/feature-toggle";
import { WalletCreditButton } from "@/components/dashboard/wallet-credit-button";

export const metadata = { title: "Wallets" };

export default async function WalletPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));
  if (!merchant) redirect("/sign-in");

  const [customerCount] = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.merchantId, userId));

  const walletRows = merchant.walletEnabled
    ? await db
        .select({
          id: wallets.id,
          balance: wallets.balance,
          currency: wallets.currency,
          customerId: wallets.customerId,
          customerName: customers.name,
          customerEmail: customers.email,
          updatedAt: wallets.updatedAt,
        })
        .from(wallets)
        .innerJoin(customers, eq(wallets.customerId, customers.id))
        .where(eq(wallets.merchantId, userId))
        .orderBy(desc(wallets.balance))
    : [];

  const totalBalance = walletRows.reduce((s, w) => s + w.balance, 0);

  return (
    <>
      <Topbar
        title="Customer wallets"
        description="Offer stored value to your customers for faster repeat purchases."
        actions={
          merchant.walletEnabled ? <WalletCreditButton /> : undefined
        }
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Feature
              </p>
              <h2 className="mt-1 font-display text-lg">Customer wallets</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Let your customers hold a balance with you — great for
                subscriptions, refunds, store credit, and loyalty rewards.
              </p>
            </div>
            <FeatureToggle
              flag="walletEnabled"
              initial={merchant.walletEnabled}
              label="Enable wallets"
            />
          </div>

          {merchant.walletEnabled && (
            <div className="grid grid-cols-3 divide-x divide-border/60">
              <Stat label="Total balance" value={formatCurrency(totalBalance)} />
              <Stat
                label="Active wallets"
                value={walletRows.length.toString()}
              />
              <Stat
                label="Customers"
                value={(customerCount?.count ?? 0).toString()}
              />
            </div>
          )}
        </section>

        {merchant.walletEnabled && (
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-6 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Balances
              </p>
              <h2 className="mt-1 font-display text-lg">
                Customer wallets
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {walletRows.length}
                </span>
              </h2>
            </div>

            {walletRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                  <WalletIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-display text-lg">No wallets yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Credit a customer to create their first wallet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-left">
                      <Th>Customer</Th>
                      <Th>Balance</Th>
                      <Th>Updated</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {walletRows.map((w) => (
                      <tr
                        key={w.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <Td>
                          <p className="font-medium">{w.customerName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {w.customerEmail}
                          </p>
                        </Td>
                        <Td>
                          <span className="font-display text-base">
                            {formatCurrency(w.balance, w.currency)}
                          </span>
                        </Td>
                        <Td className="font-mono text-xs text-muted-foreground">
                          {formatDate(w.updatedAt)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
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
