import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, customers, merchants } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Topbar } from "@/components/dashboard/topbar";
import { CreditWalletForm } from "@/components/dashboard/credit-wallet-form";

export const metadata = { title: "Credit wallet" };

export default async function CreditWalletPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) redirect("/sign-in");
  if (!merchant.walletEnabled) redirect("/wallet");

  const customerList = await db
    .select({ id: customers.id, name: customers.name, email: customers.email })
    .from(customers)
    .where(eq(customers.merchantId, userId))
    .orderBy(desc(customers.updatedAt))
    .limit(500);

  return (
    <>
      <Topbar
        title="Credit wallet"
        description="Add store credit to a customer's wallet."
      />
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-10">
        <CreditWalletForm customers={customerList} />
      </div>
    </>
  );
}
