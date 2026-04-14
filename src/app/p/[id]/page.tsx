import { db, paymentLinks } from "@/lib/db";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BrandedPaymentLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [link] = await db
    .select()
    .from(paymentLinks)
    .where(eq(paymentLinks.id, id));

  if (!link || link.status !== "active" || !link.stripePaymentLinkUrl) {
    notFound();
  }

  redirect(link.stripePaymentLinkUrl);
}
