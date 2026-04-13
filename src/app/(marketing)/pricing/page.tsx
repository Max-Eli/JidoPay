import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

export const metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing. No subscriptions, no setup fees.",
};

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-10">
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
              One simple fee. No monthly subscriptions, no setup costs, no hidden
              charges. Just pay when you get paid.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pricing card */}
      <section className="pb-24">
        <Reveal className="mx-auto max-w-4xl px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-12 transition-all hover:border-accent/40 hover:shadow-[0_24px_80px_-20px_rgba(56,182,255,0.25)] md:p-16">
            <div className="relative grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-16">
              {/* Left side — price */}
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Pay-as-you-go
                </span>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-display-xl leading-none text-accent">
                    0.5%
                  </span>
                </div>
                <p className="mt-3 text-muted-foreground">
                  per successful transaction
                </p>
                <div className="my-10 editorial-rule" />
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Standard payment processing fees apply separately (typically
                  2.9% + $0.30 per card transaction). Payments are securely
                  processed by our payment infrastructure partners.
                </p>
                <Link
                  href="/sign-up"
                  className="group mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-all hover:bg-foreground/90"
                >
                  Get started
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Right side — included */}
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Everything included
                </span>
                <ul className="mt-6 space-y-4">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent/10">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Decorative accent glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
            />
          </div>
        </Reveal>
      </section>

      {/* Example breakdown */}
      <section className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <Reveal className="text-center">
            <h2 className="font-display text-display-md">
              See exactly where your money goes.
            </h2>
            <p className="mt-6 text-muted-foreground">
              A worked example on a $100 payment.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-16 overflow-hidden rounded-2xl border border-border/60">
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
                    <td className="px-8 py-5">
                      <div className="font-medium">{row.label}</div>
                      {row.sub && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {row.sub}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right font-mono text-base">
                      {row.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Processing fees set by our payment infrastructure partners. Your
            exact rate may vary by card type and country.
          </p>
        </div>
      </section>

      {/* FAQ */}
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
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const INCLUDED = [
  "Unlimited payment links",
  "Unlimited invoicing",
  "Customer management",
  "Real-time analytics dashboard",
  "AI-powered assistant",
  "Automated payment reminders",
  "Multi-currency support",
  "Bank-grade security",
  "Full audit trail",
  "Export to CSV anytime",
];

const BREAKDOWN = [
  { label: "Customer payment", amount: "$100.00", sub: null },
  {
    label: "Processing fee",
    amount: "−$3.20",
    sub: "2.9% + $0.30 — goes to payment infrastructure partner",
  },
  {
    label: "JidoPay platform fee",
    amount: "−$0.50",
    sub: "0.5% — our only fee",
  },
  {
    label: "You receive",
    amount: "$96.30",
    sub: null,
    emphasis: true,
  },
];

const FAQ = [
  {
    q: "Are there any monthly fees?",
    a: "No. JidoPay is completely free to join and use. You only pay our 0.5% fee on successful transactions. If you don't process payments, you don't pay us anything.",
  },
  {
    q: "When do I get paid?",
    a: "Funds are typically available in your bank account within 2 business days of a successful payment. You can also request instant payouts for a small fee.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There's no contract or commitment. You can stop using JidoPay anytime and your data remains exportable for as long as your account exists.",
  },
  {
    q: "Is there a transaction minimum?",
    a: "The minimum payment amount is $0.50. There's no maximum — JidoPay handles transactions of any size.",
  },
  {
    q: "Do you support international payments?",
    a: "Yes. JidoPay accepts payments in over 100 currencies from customers worldwide, with automatic conversion to your preferred payout currency.",
  },
  {
    q: "What happens if there's a dispute or chargeback?",
    a: "You'll be notified immediately with full context and our AI assistant can help you craft a response. Standard dispute fees apply as set by our payment infrastructure partners.",
  },
];
