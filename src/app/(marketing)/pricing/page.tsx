import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Shield,
  Lock,
  Globe,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";

export const metadata = {
  title: "Pricing",
  description: "One simple rate. No subscriptions. No setup fees. No surprises.",
};

export default function PricingPage() {
  return (
    <>
      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <Parallax
          offset={120}
          className="pointer-events-none absolute -left-48 top-10 -z-10"
        >
          <div
            aria-hidden
            className="h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl"
          />
        </Parallax>
        <Parallax
          offset={-100}
          className="pointer-events-none absolute -right-40 bottom-0 -z-10"
        >
          <div
            aria-hidden
            className="h-[420px] w-[420px] rounded-full bg-foreground/[0.04] blur-3xl"
          />
        </Parallax>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
          <Reveal>
            <div className="mb-6 flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-foreground/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Pricing
              </span>
              <span className="h-px w-8 bg-foreground/40" />
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <h1 className="font-display text-display-lg">
              Simple.
              <br />
              <em className="text-accent">Transparent</em>.
              <br />
              No surprises.
            </h1>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mx-auto mt-10 max-w-xl text-lg text-muted-foreground">
              One flat rate on successful transactions. No monthly subscriptions,
              no setup costs, no hidden charges — you only pay when you get paid.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── Pricing card ─────────────────────────────────────────────── */}
      <section className="pb-16">
        <Reveal className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-12 md:p-16">
            <div className="relative grid gap-12 md:grid-cols-[1.25fr_1fr] md:gap-16">
              {/* Left — price */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-px w-6 bg-foreground/40" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Pay-as-you-go
                  </span>
                </div>

                <div className="mt-10 flex items-baseline gap-3">
                  <span className="font-display text-[96px] leading-none text-foreground md:text-[120px]">
                    3.5<span className="text-accent">%</span>
                  </span>
                  <span className="font-display text-3xl text-muted-foreground md:text-4xl">
                    + 30¢
                  </span>
                </div>
                <p className="mt-4 text-muted-foreground">
                  per successful transaction
                </p>

                <div className="my-10 editorial-rule max-w-xs" />

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    No monthly fees, ever
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    No setup or onboarding costs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    No contracts or commitments
                  </li>
                </ul>

                <Link
                  href="/sign-up"
                  className="group mt-12 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
                >
                  Start accepting payments
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Right — included */}
              <div className="md:border-l md:border-border/60 md:pl-16">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Everything included
                </span>
                <ul className="mt-6 space-y-4">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
            />
          </div>
        </Reveal>
      </section>

      {/* ─── Trust strip ──────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border/60 md:grid-cols-4">
          {TRUST.map((item, idx) => (
            <Reveal
              key={item.label}
              delay={idx * 0.08}
              direction="up"
              className="flex items-center gap-4 bg-background px-6 py-8 md:px-8"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <item.icon className="h-4 w-4 text-accent" />
              </div>
              <div>
                <div className="font-display text-sm">{item.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {item.sub}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Breakdown ───────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <Reveal className="text-center">
            <div className="mb-6 flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-foreground/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Worked example
              </span>
              <span className="h-px w-8 bg-foreground/40" />
            </div>
            <h2 className="font-display text-display-md">
              See exactly where
              <br />
              your money goes.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
              A transparent breakdown on a $100 customer payment.
            </p>
          </Reveal>

          <Reveal
            delay={0.15}
            className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-card"
          >
            <table className="w-full text-sm">
              <tbody>
                {BREAKDOWN.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`${
                      i !== BREAKDOWN.length - 1
                        ? "border-b border-border/60"
                        : ""
                    } ${row.emphasis ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-8 py-6">
                      <div
                        className={`font-medium ${
                          row.emphasis ? "font-display text-base" : ""
                        }`}
                      >
                        {row.label}
                      </div>
                      {row.sub && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {row.sub}
                        </div>
                      )}
                    </td>
                    <td
                      className={`px-8 py-6 text-right font-mono ${
                        row.emphasis ? "text-lg" : "text-base"
                      }`}
                    >
                      {row.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      {/* ─── Value props ─────────────────────────────────────────────── */}
      <section className="border-t border-border/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Why flat pricing
            </span>
            <h2 className="mt-4 font-display text-display-md">
              Predictable by design.
            </h2>
            <p className="mt-6 text-muted-foreground">
              No tiers. No volume discounts you have to beg for. No surprise bills
              at the end of the month. One rate that scales with your business.
            </p>
          </Reveal>

          <div className="mt-20 grid gap-px overflow-hidden rounded-2xl bg-border/60 md:grid-cols-3">
            {VALUES.map((item, idx) => (
              <Reveal
                key={item.title}
                delay={idx * 0.1}
                className="group bg-background p-10 transition-colors hover:bg-muted/30"
              >
                <div className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 font-display text-2xl transition-colors group-hover:text-accent">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────── */}
      <section className="border-t border-border/60 py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-10">
          <Reveal className="text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Frequently asked
            </span>
            <h2 className="mt-4 font-display text-display-md">
              Common questions.
            </h2>
          </Reveal>

          <div className="mt-16 divide-y divide-border/60">
            {FAQ.map((item, idx) => (
              <Reveal key={item.q} delay={idx * 0.06}>
                <div className="py-8">
                  <h3 className="font-display text-xl">{item.q}</h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border/60 bg-foreground py-32 text-background">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <Reveal>
            <h2 className="font-display text-display-md">
              Ready when you are.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-background/70">
              Create an account in under a minute and start getting paid today.
              You only pay when a customer pays you.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <Link
              href="/sign-up"
              className="group mt-12 inline-flex items-center gap-2 rounded-full bg-background px-8 py-4 text-sm font-medium text-foreground transition-all hover:scale-[1.02] hover:bg-background/90"
            >
              Start accepting payments
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
        />
      </section>
    </>
  );
}

const INCLUDED = [
  "Unlimited payment links",
  "Unlimited invoicing",
  "Customer management & insights",
  "Real-time revenue dashboard",
  "AI-powered assistant",
  "SMS & email campaigns",
  "Abandoned cart recovery",
  "Customer wallets & one-click pay",
  "Multi-currency support",
  "Full audit trail & CSV export",
];

const TRUST = [
  {
    icon: Shield,
    label: "PCI DSS compliant",
    sub: "Bank-grade compliance",
  },
  {
    icon: Lock,
    label: "256-bit encryption",
    sub: "In transit & at rest",
  },
  {
    icon: Zap,
    label: "2-day payouts",
    sub: "Or instant, on demand",
  },
  {
    icon: Globe,
    label: "100+ currencies",
    sub: "Accept from anywhere",
  },
];

const BREAKDOWN = [
  { label: "Customer payment", amount: "$100.00", sub: null, emphasis: false },
  {
    label: "JidoPay fee",
    amount: "−$3.80",
    sub: "3.5% + $0.30 — our only fee",
    emphasis: false,
  },
  {
    label: "You receive",
    amount: "$96.20",
    sub: null,
    emphasis: true,
  },
];

const VALUES = [
  {
    title: "No monthly bill",
    description:
      "If you don't process payments, you don't pay us anything. No subscriptions, no platform fees, no minimums.",
  },
  {
    title: "One flat rate",
    description:
      "3.5% + 30¢ on every successful transaction. The same rate at $100 or $100,000 in monthly volume.",
  },
  {
    title: "Always transparent",
    description:
      "Every transaction, every fee, every payout — visible in real time in your dashboard. Export everything, anytime.",
  },
];

const FAQ = [
  {
    q: "Are there any monthly fees?",
    a: "No. JidoPay is completely free to join and use. You only pay our 3.5% + 30¢ fee on successful transactions. If you don't process payments, you don't pay us anything.",
  },
  {
    q: "When do I get paid?",
    a: "Funds are typically available in your bank account within 2 business days of a successful payment. You can also request instant payouts for a small additional fee.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There's no contract or commitment. You can stop using JidoPay anytime, and your data remains exportable for as long as your account exists.",
  },
  {
    q: "Is there a transaction minimum?",
    a: "The minimum payment amount is $0.50. There's no maximum — JidoPay handles transactions of any size, from a coffee to a six-figure invoice.",
  },
  {
    q: "Do you support international payments?",
    a: "Yes. JidoPay accepts payments in over 100 currencies from customers worldwide, with automatic conversion to your preferred payout currency.",
  },
  {
    q: "What happens if there's a dispute or chargeback?",
    a: "You'll be notified immediately with full context, and our AI assistant can help you craft a response. Standard dispute handling fees apply.",
  },
  {
    q: "Does the rate change at higher volumes?",
    a: "No. Our rate is the same whether you process $500 or $5 million a month. No tiers, no volume discounts you have to negotiate for.",
  },
];
