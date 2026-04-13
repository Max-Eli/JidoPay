import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Sparkles,
  Zap,
  FileText,
  Link2,
  Users,
  Shield,
  BarChart3,
  Megaphone,
  ShoppingCart,
  Wallet,
  MousePointerClick,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";
import { Counter } from "@/components/motion/counter";

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-32 pt-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal delay={0} distance={12}>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-foreground/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Now in private beta
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <h1 className="mt-8 max-w-5xl font-display text-display-xl">
              Payments,
              <br />
              <em className="text-accent">reimagined</em> for
              <br />
              modern business.
            </h1>
          </Reveal>

          <Reveal delay={0.24}>
            <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
              JidoPay is the unified platform for accepting payments, sending
              invoices, and managing customers. Beautifully designed. Relentlessly
              secure.
            </p>
          </Reveal>

          <Reveal delay={0.36}>
            <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
              >
                Start accepting payments
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-4 text-sm font-medium text-foreground transition-all hover:scale-[1.02] hover:bg-muted"
              >
                See how it works
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.48}>
            <div className="mt-20 flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
              <div className="editorial-rule flex-1 max-w-xs" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Trusted infrastructure. Built for scale.
              </p>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  PCI DSS compliant
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" />
                  SOC 2 aligned
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Parallax glow */}
        <Parallax offset={120} className="pointer-events-none absolute -right-48 top-1/2 -translate-y-1/2">
          <div
            aria-hidden
            className="h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl"
          />
        </Parallax>
      </section>

      {/* ─── Value bar ────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/60 px-6 md:grid-cols-4 lg:px-10">
          <Reveal direction="up" delay={0} className="px-6 py-10 first:pl-0 md:px-10">
            <div className="font-display text-4xl md:text-5xl">
              <Counter value={0.5} decimals={1} suffix="%" />
            </div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              Platform fee
            </div>
          </Reveal>
          <Reveal direction="up" delay={0.1} className="px-6 py-10 md:px-10">
            <div className="font-display text-4xl md:text-5xl">24/7</div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              Uptime monitoring
            </div>
          </Reveal>
          <Reveal direction="up" delay={0.2} className="px-6 py-10 md:px-10">
            <div className="font-display text-4xl md:text-5xl">
              <Counter value={256} suffix="-bit" />
            </div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              Encryption
            </div>
          </Reveal>
          <Reveal direction="up" delay={0.3} className="px-6 py-10 md:px-10">
            <div className="font-display text-4xl md:text-5xl">
              <Counter value={100} suffix="+" />
            </div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              Currencies
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Feature grid ────────────────────────────────────────────── */}
      <section className="py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr] lg:gap-24">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Reveal>
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-px w-8 bg-foreground/40" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Everything you need
                  </span>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="font-display text-display-lg">
                  One platform.
                  <br />
                  Every payment tool
                  <br />
                  your business needs.
                </h2>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-md text-muted-foreground">
                  From accepting first payments to managing recurring revenue,
                  JidoPay has the tools to get you paid and keep you growing.
                </p>
              </Reveal>
            </div>

            <div className="space-y-px">
              {FEATURES.map((feature, idx) => (
                <Reveal key={feature.title} delay={idx * 0.08} direction="up">
                  <div className="group grid grid-cols-[auto_1fr_auto] items-start gap-6 border-t border-border/60 py-10 transition-colors first:border-t-0 hover:bg-muted/30 md:py-12">
                    <div className="font-mono text-xs text-muted-foreground">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl md:text-3xl">
                        {feature.title}
                      </h3>
                      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <feature.icon className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-accent" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quote / Editorial ─────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30 py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-10">
          <Reveal>
            <Sparkles className="mx-auto mb-8 h-6 w-6 text-accent" />
          </Reveal>
          <Reveal delay={0.15}>
            <blockquote className="font-display text-display-md italic">
              &ldquo;The payments experience your business deserves — finally
              built with the care it&rsquo;s always needed.&rdquo;
            </blockquote>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-12 flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-border" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                The JidoPay ethos
              </span>
              <div className="h-px w-12 bg-border" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── AI section ─────────────────────────────────────────────── */}
      <section className="py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <Reveal direction="right">
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-px w-8 bg-foreground/40" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Intelligence built in
                  </span>
                </div>
              </Reveal>
              <Reveal direction="right" delay={0.1}>
                <h2 className="font-display text-display-lg">
                  An assistant that
                  <br />
                  understands your
                  <br />
                  <em className="text-accent">business</em>.
                </h2>
              </Reveal>
              <Reveal direction="right" delay={0.2}>
                <p className="mt-8 max-w-md text-muted-foreground">
                  JidoPay&rsquo;s built-in assistant has full context of your
                  revenue, customers, and payment patterns. Ask anything — from
                  drafting professional follow-ups to surfacing insights you
                  might have missed.
                </p>
              </Reveal>
              <ul className="mt-8 space-y-3">
                {AI_CAPABILITIES.map((item, idx) => (
                  <Reveal key={item} delay={0.3 + idx * 0.08} direction="right" as="li">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                      {item}
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>

            <Reveal direction="left" delay={0.15}>
              <div className="relative">
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_8px_40px_-12px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-1">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs text-muted-foreground">
                      JidoPay Assistant
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-foreground px-4 py-3 text-sm text-background">
                      How did my revenue this month compare to last?
                    </div>
                    <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-relaxed">
                      Your revenue is up 23% month over month — $47,200 in April
                      vs $38,400 in March. Most of the growth came from 3 new
                      recurring customers. Want me to draft thank-you notes?
                    </div>
                  </div>
                </div>

                <div className="absolute -top-3 -right-3 rounded-full border border-border bg-background px-3 py-1.5 shadow-sm">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Real-time
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border/60 bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-6 py-32 text-center lg:px-10 lg:py-40">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-display-lg">
                Ready to get paid,
                <br />
                <em className="text-accent">beautifully</em>?
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mx-auto mt-8 max-w-xl text-background/70">
                Join the businesses already accepting payments with JidoPay. No
                monthly fees. No setup. Just elegant, powerful payments.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 rounded-full bg-background px-8 py-4 text-sm font-medium text-foreground transition-all hover:scale-[1.02] hover:bg-background/90"
                >
                  Start accepting payments
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-background/20 px-8 py-4 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-background/10"
                >
                  View pricing
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        <Parallax offset={100} className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div
            aria-hidden
            className="h-[400px] w-[800px] rounded-full bg-accent/15 blur-3xl"
          />
        </Parallax>
      </section>
    </>
  );
}

const FEATURES = [
  {
    title: "Payment Links",
    description:
      "Create a branded payment link in seconds. Share it anywhere — email, text, social. Get paid instantly.",
    icon: Link2,
  },
  {
    title: "Professional Invoicing",
    description:
      "Send beautifully formatted invoices with line items, taxes, and automatic payment reminders.",
    icon: FileText,
  },
  {
    title: "Revenue Dashboard",
    description:
      "Real-time insights into your revenue, payments, and customer trends. Export to CSV anytime.",
    icon: BarChart3,
  },
  {
    title: "Customer Management",
    description:
      "Every customer who pays you is automatically tracked — lifetime value, payment history, and more.",
    icon: Users,
  },
  {
    title: "SMS & Email Campaigns",
    description:
      "Win back inactive customers, reward repeat buyers, and recover abandoned checkouts with one-tap retargeting blasts.",
    icon: Megaphone,
  },
  {
    title: "Abandoned Cart Recovery",
    description:
      "Every checkout that didn't convert is captured automatically — send an SMS reminder and bring the buyer back.",
    icon: ShoppingCart,
  },
  {
    title: "Customer Wallets",
    description:
      "Offer your customers a stored balance for store credit, refunds, and loyalty rewards. Optional, opt-in per merchant.",
    icon: Wallet,
  },
  {
    title: "One-Click Pay",
    description:
      "Returning customers check out on future payment links with a single tap — higher conversion, less friction.",
    icon: MousePointerClick,
  },
  {
    title: "Instant Payouts",
    description:
      "Funds arrive in your bank account on a schedule you control. No delays, no surprises.",
    icon: Zap,
  },
  {
    title: "Bank-Grade Security",
    description:
      "End-to-end encryption, PCI compliance, and fraud protection. Your customers&rsquo; data is safe.",
    icon: Shield,
  },
];

const AI_CAPABILITIES = [
  "Analyze revenue trends in plain English",
  "Draft follow-up emails for overdue invoices",
  "Write professional customer messages",
  "Suggest pricing strategies based on your data",
];
