import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db, paymentLinks } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { Topbar } from "@/components/dashboard/topbar";
import { EmbedSnippetPanel } from "@/components/dashboard/embed-snippet-panel";

export const metadata = { title: "Embed on your site" };

export default async function EmbedSnippetPage({
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
        title="Embed on your site"
        description="Drop JidoPay checkout into any website."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-8 py-10">
        <Link
          href="/payment-links"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to payment links
        </Link>

        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Payment link
              </p>
              <h2 className="mt-1 font-display text-lg">{link.name}</h2>
              {link.description && (
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  {link.description}
                </p>
              )}
            </div>
            {link.stripePaymentLinkUrl && (
              <a
                href={link.stripePaymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open hosted checkout"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-accent/60 hover:text-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="p-6">
            <EmbedSnippetPanel linkId={link.id} />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-1 font-display text-lg">Two lines, any site</h2>
          </div>
          <ul className="divide-y divide-border/60">
            <Step
              n={1}
              title="Add the script tag once"
              body="Paste it in your site's <head> (or anywhere in the body). It loads asynchronously and adds no dependencies."
            />
            <Step
              n={2}
              title="Add a button with the data attribute"
              body="Any element with data-jidopay will open a secure JidoPay checkout overlay when clicked. Style it however you want."
            />
            <Step
              n={3}
              title="Works everywhere"
              body="WordPress, Shopify, Webflow, Framer, raw HTML — anywhere you can add a script tag."
            />
          </ul>
        </section>
      </div>
    </>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-4 px-6 py-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40 font-display text-sm">
        {n}
      </span>
      <div>
        <p className="font-display text-base">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
