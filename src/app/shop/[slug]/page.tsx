import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, merchants, paymentLinks } from "@/lib/db";
import { and, eq, desc } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { Lock, ShieldCheck, ArrowUpRight } from "lucide-react";
import { brandedPayUrl } from "@/lib/branded-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [merchant] = await db
    .select({
      businessName: merchants.businessName,
      tagline: merchants.storefrontTagline,
      enabled: merchants.storefrontEnabled,
    })
    .from(merchants)
    .where(eq(merchants.storefrontSlug, slug));

  if (!merchant || !merchant.enabled) {
    return { title: "Storefront · JidoPay", robots: { index: false } };
  }

  const name = merchant.businessName ?? "Storefront";
  return {
    title: `${name} · JidoPay`,
    description:
      merchant.tagline ?? `Shop ${name} — secure checkout powered by JidoPay.`,
    openGraph: {
      title: name,
      description: merchant.tagline ?? undefined,
    },
  };
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.storefrontSlug, slug));

  if (!merchant || !merchant.storefrontEnabled) {
    notFound();
  }

  const links = await db
    .select()
    .from(paymentLinks)
    .where(
      and(
        eq(paymentLinks.merchantId, merchant.id),
        eq(paymentLinks.status, "active")
      )
    )
    .orderBy(desc(paymentLinks.createdAt));

  const displayName = merchant.businessName ?? "Storefront";

  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(var(--accent-rgb,99_102_241)/0.18),transparent_60%)]"
        />

        <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 pt-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
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
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
            <Lock className="h-3 w-3" />
            Secure checkout
          </div>
        </header>

        <section className="relative z-10 mx-auto max-w-5xl px-6 pb-6 pt-14 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            @{merchant.storefrontSlug}
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.02em] sm:text-5xl">
            {displayName}
          </h1>
          {merchant.storefrontTagline && (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {merchant.storefrontTagline}
            </p>
          )}
        </section>

        <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-10">
          {links.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card px-6 py-12 text-center">
              <p className="font-display text-lg">No items yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {displayName} hasn&apos;t published any payment links yet.
                Check back soon.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <li key={link.id}>
                  <StorefrontCard
                    name={link.name}
                    description={link.description}
                    amount={link.amount}
                    currency={link.currency}
                    href={brandedPayUrl(link.id)}
                    recurring={link.type === "recurring"}
                    interval={link.interval}
                    intervalCount={link.intervalCount}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="relative z-10 mx-auto max-w-5xl px-6 pb-12">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Payments processed securely by Stripe</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Powered by</span>
            <Link
              href="/"
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
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function StorefrontCard({
  name,
  description,
  amount,
  currency,
  href,
  recurring,
  interval,
  intervalCount,
}: {
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  href: string;
  recurring: boolean;
  interval: "day" | "week" | "month" | "year" | null;
  intervalCount: number | null;
}) {
  const displayAmount =
    amount > 0 ? formatCurrency(amount, currency) : "Custom amount";
  const intervalLabel = recurring && interval ? formatInterval(interval, intervalCount ?? 1) : null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]"
    >
      <div className="flex-1">
        <h3 className="font-display text-lg leading-tight tracking-[-0.01em]">
          {name}
        </h3>
        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-2xl tracking-[-0.02em]">
            {displayAmount}
          </p>
          {intervalLabel && (
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {intervalLabel}
            </p>
          )}
        </div>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background transition-transform group-hover:scale-[1.04]">
          Buy
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}

function formatInterval(
  interval: "day" | "week" | "month" | "year",
  count: number
): string {
  const unit = count === 1 ? interval : `${interval}s`;
  return count === 1 ? `per ${interval}` : `every ${count} ${unit}`;
}
