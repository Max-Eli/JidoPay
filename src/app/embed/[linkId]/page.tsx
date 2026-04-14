import Image from "next/image";
import { notFound } from "next/navigation";
import { db, paymentLinks, merchants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { Lock, ShieldCheck } from "lucide-react";
import { EmbedCheckoutButton } from "@/components/embed/checkout-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;
  const [link] = await db
    .select({ name: paymentLinks.name })
    .from(paymentLinks)
    .where(eq(paymentLinks.id, linkId));
  return {
    title: link?.name ? `${link.name} · JidoPay` : "JidoPay checkout",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ linkId: string }>;
  searchParams: Promise<{ theme?: string; autoload?: string }>;
}) {
  const { linkId } = await params;
  const { autoload } = await searchParams;

  const [row] = await db
    .select({
      link: paymentLinks,
      merchantName: merchants.businessName,
    })
    .from(paymentLinks)
    .innerJoin(merchants, eq(paymentLinks.merchantId, merchants.id))
    .where(eq(paymentLinks.id, linkId));

  if (!row || row.link.status !== "active" || !row.link.stripePaymentLinkUrl) {
    notFound();
  }

  const { link, merchantName } = row;
  const displayAmount =
    link.amount > 0
      ? formatCurrency(link.amount, link.currency)
      : "Custom amount";

  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <div className="relative flex min-h-screen flex-col">
        {/* Accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(ellipse_at_top,rgba(var(--accent-rgb,99_102_241)/0.18),transparent_60%)]"
        />

        {/* Header — JidoPay branding */}
        <header className="relative z-10 flex items-center justify-between px-6 pt-6">
          <div className="inline-flex items-center gap-2.5">
            <Image
              src="/favicon.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="font-display text-[18px] leading-none tracking-[-0.01em]">
              JidoPay
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
            <Lock className="h-3 w-3" />
            Secure
          </div>
        </header>

        {/* Card */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-8">
          <div className="w-full max-w-[400px]">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_20px_60px_-24px_rgba(0,0,0,0.35)]">
              <div className="px-6 pb-5 pt-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {merchantName ?? "Merchant"}
                </p>
                <h1 className="mt-1.5 font-display text-[22px] leading-tight tracking-[-0.01em]">
                  {link.name}
                </h1>
                {link.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {link.description}
                  </p>
                )}
              </div>

              <div className="mx-6 rounded-xl border border-border/60 bg-muted/30 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Amount due
                </p>
                <p className="mt-1 font-display text-3xl tracking-[-0.02em]">
                  {displayAmount}
                </p>
              </div>

              <div className="px-6 py-6">
                <EmbedCheckoutButton
                  url={link.stripePaymentLinkUrl!}
                  autoload={autoload === "1"}
                />
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Payments processed securely by Stripe</span>
                </div>
              </div>
            </div>

            {/* Powered by JidoPay footer */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Powered by</span>
              <a
                href="https://jidopay.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-display text-foreground transition-colors hover:text-accent"
              >
                <Image
                  src="/favicon.png"
                  alt=""
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5"
                />
                JidoPay
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
