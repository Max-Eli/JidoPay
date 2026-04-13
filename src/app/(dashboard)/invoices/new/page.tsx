import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, merchants } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { NewInvoiceForm } from "@/components/dashboard/new-invoice-form";

export const metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) redirect("/sign-in");

  if (!merchant.stripeChargesEnabled) {
    redirect("/onboarding");
  }

  return (
    <>
      <Topbar
        title="New invoice"
        description="Draft an invoice, add line items, and send it to your customer."
      />
      <div className="mx-auto max-w-3xl px-8 py-10">
        <NewInvoiceForm />
      </div>
    </>
  );
}
