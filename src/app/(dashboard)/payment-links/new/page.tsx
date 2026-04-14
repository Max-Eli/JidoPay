import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, merchants } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { NewPaymentLinkForm } from "@/components/dashboard/new-payment-link-form";

export const metadata = { title: "New payment link" };

export default async function NewPaymentLinkPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) redirect("/sign-in");
  if (!merchant.stripeChargesEnabled) redirect("/onboarding");

  return (
    <>
      <Topbar
        title="New payment link"
        description="Sell a product or start a subscription. Share the link anywhere."
      />
      <div className="mx-auto max-w-3xl px-8 py-10">
        <NewPaymentLinkForm />
      </div>
    </>
  );
}
