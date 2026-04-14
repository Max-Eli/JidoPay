import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db, paymentLinks } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { Topbar } from "@/components/dashboard/topbar";
import { EditPaymentLinkForm } from "@/components/dashboard/edit-payment-link-form";

export const metadata = { title: "Edit payment link" };

export default async function EditPaymentLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const [link] = await db
    .select()
    .from(paymentLinks)
    .where(and(eq(paymentLinks.id, id), eq(paymentLinks.merchantId, userId)));

  if (!link) notFound();

  return (
    <>
      <Topbar
        title="Edit payment link"
        description="Update details or replace the price by creating a new link."
      />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        <Link
          href="/payment-links"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to payment links
        </Link>

        <EditPaymentLinkForm
          id={link.id}
          name={link.name}
          description={link.description ?? ""}
          amount={link.amount}
          currency={link.currency}
          status={link.status}
          type={link.type}
        />
      </div>
    </>
  );
}
