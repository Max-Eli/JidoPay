import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Zap, Key } from "lucide-react";
import { db, merchants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { StorefrontForm } from "@/components/dashboard/storefront-form";
import { Topbar } from "@/components/dashboard/topbar";
import { StatusPill } from "@/components/dashboard/status-pill";
import { FeatureToggle } from "@/components/dashboard/feature-toggle";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) redirect("/sign-in");

  return (
    <>
      <Topbar
        title="Settings"
        description="Manage your business profile and payout configuration."
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        <Section
          eyebrow="Profile"
          title="Business details"
          description="The display name your customers see at checkout, on invoices, and in receipts. Use your brand or DBA — not your legal name."
        >
          <SettingsForm
            merchantId={merchant.id}
            businessName={merchant.businessName ?? ""}
          />
        </Section>

        <Section
          eyebrow="Storefront"
          title="Your public shop page"
          description="A zero-code catalog page at jidopay.com/shop/your-handle that lists every active payment link. Share the link on social, in your bio, or in texts — no website needed."
        >
          <StorefrontForm
            initialSlug={merchant.storefrontSlug ?? ""}
            initialTagline={merchant.storefrontTagline ?? ""}
            initialEnabled={merchant.storefrontEnabled}
          />
        </Section>

        <Section
          eyebrow="Payouts"
          title="Account status"
          description="Your connected payout account handles all payment processing."
        >
          <div className="space-y-4">
            <StatusRow
              label="Onboarding complete"
              ok={!!merchant.stripeOnboardingComplete}
            />
            <StatusRow
              label="Charges enabled"
              ok={!!merchant.stripeChargesEnabled}
            />
            <StatusRow
              label="Payouts enabled"
              ok={!!merchant.stripePayoutsEnabled}
            />

            {merchant.stripeAccountId && (
              <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Account ID
                </p>
                <p className="mt-1 font-mono text-xs text-foreground">
                  {merchant.stripeAccountId}
                </p>
              </div>
            )}
          </div>
        </Section>

        <Section
          eyebrow="Features"
          title="Customer experience"
          description="Opt-in tools to boost conversion and loyalty."
        >
          <div className="divide-y divide-border/60">
            <FeatureRow
              title="One-click pay"
              description="Save returning customers' payment details so they can check out with a single click on future payment links."
              flag="oneClickPayEnabled"
              initial={merchant.oneClickPayEnabled}
            />
            <FeatureRow
              title="Customer wallets"
              description="Offer stored-value balances your customers can spend against — useful for store credit, refunds, and loyalty."
              flag="walletEnabled"
              initial={merchant.walletEnabled}
            />
            <FeatureRow
              title="Abandoned cart recovery"
              description="Automatically capture expired checkout sessions so you can send SMS or email reminders."
              flag="abandonedRecoveryEnabled"
              initial={merchant.abandonedRecoveryEnabled}
            />
          </div>
        </Section>

        <Section
          eyebrow="Developers"
          title="API & Webhooks"
          description="Build custom checkout flows with dynamic line items and deliver signed events to your own servers so you can grant access, send receipts, or sync to a CRM the moment a payment succeeds."
        >
          <div className="space-y-3">
            <Link
              href="/settings/api-keys"
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-accent/60 hover:bg-accent/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
                  <Key className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="font-display text-sm">API keys</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Authenticate server-side calls to POST /v1/checkout and bundle multiple products into one session.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>

            <Link
              href="/settings/webhooks"
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-accent/60 hover:bg-accent/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
                  <Zap className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="font-display text-sm">Webhook endpoints</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Create, test, and replay outbound event deliveries.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          </div>
        </Section>

        <Section eyebrow="Pricing" title="Transaction fee">
          <p className="text-sm leading-relaxed text-muted-foreground">
            JidoPay charges a flat{" "}
            <span className="font-display text-foreground">3.5% + $0.30</span>{" "}
            on every successful transaction. No monthly fees, no setup costs,
            no hidden charges.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Example: on a $100 payment, you receive $96.20
          </p>
        </Section>
      </div>
    </>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-lg">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <StatusPill status={ok ? "enabled" : "pending"} />
    </div>
  );
}

function FeatureRow({
  title,
  description,
  flag,
  initial,
}: {
  title: string;
  description: string;
  flag: "oneClickPayEnabled" | "walletEnabled" | "abandonedRecoveryEnabled";
  initial: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="font-display text-base">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <FeatureToggle flag={flag} initial={initial} label={title} />
    </div>
  );
}
