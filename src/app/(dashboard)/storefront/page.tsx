import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Package, Pencil, ExternalLink } from "lucide-react";
import { db, merchants, paymentLinks } from "@/lib/db";
import { and, eq, desc } from "drizzle-orm";
import { StorefrontForm } from "@/components/dashboard/storefront-form";
import { Topbar } from "@/components/dashboard/topbar";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { brandedPayUrl } from "@/lib/branded-url";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Storefront" };

export default async function StorefrontPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch merchant + active products in parallel — they're independent
  // queries and the storefront page touches both. Filter to active links
  // only so the dashboard count matches what visitors actually see on the
  // public /shop/<slug> page (which also filters to active).
  const [[merchant], activeProducts] = await Promise.all([
    db.select().from(merchants).where(eq(merchants.id, userId)),
    db
      .select()
      .from(paymentLinks)
      .where(
        and(
          eq(paymentLinks.merchantId, userId),
          eq(paymentLinks.status, "active")
        )
      )
      .orderBy(desc(paymentLinks.createdAt)),
  ]);

  if (!merchant) redirect("/sign-in");

  return (
    <>
      <Topbar
        title="Storefront"
        description="A hosted shop page that lists every product you sell. Share one link — no website needed."
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        {/* Storefront settings */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Public shop page
            </p>
            <h2 className="mt-1 font-display text-lg">Your storefront</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hosted at jidopay.com/shop/your-handle. Share on social, in your
              bio, or in texts.
            </p>
          </div>
          <div className="px-6 py-6">
            <StorefrontForm
              initialSlug={merchant.storefrontSlug ?? ""}
              initialTagline={merchant.storefrontTagline ?? ""}
              initialEnabled={merchant.storefrontEnabled}
            />
          </div>
        </section>

        {/* Products */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                On your storefront
              </p>
              <h2 className="mt-1 font-display text-lg">
                Products
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {activeProducts.length}
                </span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Active payment links appear on your storefront automatically.
              </p>
            </div>
            {activeProducts.length > 0 && (
              <Link
                href="/payment-links/new"
                className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Add product
              </Link>
            )}
          </div>

          {activeProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-display text-lg">No products yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add your first product so visitors have something to buy when
                they land on your storefront.
              </p>
              <Link
                href="/payment-links/new"
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Add product
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {activeProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base">{p.name}</p>
                    {p.description && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      <span className="text-foreground">
                        {p.amount > 0
                          ? formatCurrency(p.amount, p.currency)
                          : "Custom amount"}
                      </span>
                      {p.type === "recurring" && p.interval && (
                        <span>
                          {p.intervalCount && p.intervalCount > 1
                            ? `every ${p.intervalCount} ${p.interval}s`
                            : `per ${p.interval}`}
                        </span>
                      )}
                      <span>
                        {p.useCount} {p.useCount === 1 ? "sale" : "sales"}
                      </span>
                    </div>
                  </div>
                  {p.stripePaymentLinkUrl && (
                    <div className="flex shrink-0 items-center gap-2">
                      <CopyLinkButton url={brandedPayUrl(p.id)} />
                      <Link
                        href={`/payment-links/${p.id}/edit`}
                        title="Edit product"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-accent/60 hover:text-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={brandedPayUrl(p.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open product page"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-accent/60 hover:text-accent"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
