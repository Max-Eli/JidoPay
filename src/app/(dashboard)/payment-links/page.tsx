import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, paymentLinks, merchants } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Link2, ExternalLink, Pencil, Store, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CreatePaymentLinkButton } from "@/components/dashboard/create-payment-link-button";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { EmbedSnippetButton } from "@/components/dashboard/embed-snippet-button";
import { Topbar } from "@/components/dashboard/topbar";
import { StatusPill } from "@/components/dashboard/status-pill";
import { brandedPayUrl, storefrontUrl } from "@/lib/branded-url";

export const metadata = { title: "Payment Links" };

export default async function PaymentLinksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [links, [merchant]] = await Promise.all([
    db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.merchantId, userId))
      .orderBy(desc(paymentLinks.createdAt)),
    db.select().from(merchants).where(eq(merchants.id, userId)),
  ]);

  const storefrontLive =
    merchant?.storefrontEnabled && merchant.storefrontSlug
      ? storefrontUrl(merchant.storefrontSlug)
      : null;

  return (
    <>
      <Topbar
        title="Payment links"
        description="Share a link and get paid instantly, anywhere."
        actions={<CreatePaymentLinkButton />}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        {storefrontLive ? (
          <Link
            href="/settings"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/5 px-6 py-5 transition-colors hover:border-accent/60 hover:bg-accent/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-background">
                <Store className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Storefront live
                </p>
                <p className="mt-0.5 truncate font-mono text-sm text-foreground">
                  {storefrontLive.replace(/^https?:\/\//, "")}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover:text-accent">
              Manage
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <Link
            href="/settings"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border/60 bg-card/60 px-6 py-5 transition-colors hover:border-accent/60 hover:bg-card"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/30">
                <Store className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm">
                  Launch your public storefront
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  A shareable page that auto-lists every active link. No code
                  needed.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover:text-accent">
              Set up
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Links
              </p>
              <h2 className="mt-1 font-display text-lg">
                Your payment links
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {links.length}
                </span>
              </h2>
            </div>
          </div>

          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                <Link2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-display text-lg">No payment links yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a link and share it with your customers.
              </p>
              <div className="mt-6">
                <CreatePaymentLinkButton />
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="group flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-display text-lg">
                        {link.name}
                      </p>
                      <StatusPill status={link.status} />
                    </div>
                    {link.description && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      <span className="text-foreground">
                        {formatCurrency(link.amount, link.currency)}
                      </span>
                      <span>
                        {link.useCount}{" "}
                        {link.useCount === 1 ? "use" : "uses"}
                      </span>
                      <span>
                        {formatCurrency(link.totalCollected, link.currency)}{" "}
                        collected
                      </span>
                      <span>Created {formatDate(link.createdAt)}</span>
                    </div>
                  </div>
                  {link.stripePaymentLinkUrl && (
                    <div className="flex shrink-0 items-center gap-2">
                      <CopyLinkButton url={brandedPayUrl(link.id)} />
                      <EmbedSnippetButton linkId={link.id} />
                      <Link
                        href={`/payment-links/${link.id}/edit`}
                        title="Edit link"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-accent/60 hover:text-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={brandedPayUrl(link.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open link"
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
        </div>
      </div>
    </>
  );
}
