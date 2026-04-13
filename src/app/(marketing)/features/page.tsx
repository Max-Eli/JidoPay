import Link from "next/link";
import {
  ArrowUpRight,
  Link2,
  FileText,
  BarChart3,
  Users,
  Zap,
  Shield,
  Bot,
  RefreshCw,
  Bell,
  Download,
  Globe,
  Lock,
  Megaphone,
  ShoppingCart,
  Wallet,
  MousePointerClick,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";

export const metadata = {
  title: "Features",
  description:
    "Every tool your business needs to accept payments, send invoices, and grow revenue.",
};

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <Parallax
          offset={120}
          className="pointer-events-none absolute -right-48 top-1/2 -translate-y-1/2 -z-10"
        >
          <div
            aria-hidden
            className="h-[620px] w-[620px] rounded-full bg-accent/10 blur-3xl"
          />
        </Parallax>
        <Parallax
          offset={-90}
          className="pointer-events-none absolute -left-32 -top-20 -z-10"
        >
          <div
            aria-hidden
            className="h-[360px] w-[360px] rounded-full bg-foreground/[0.04] blur-3xl"
          />
        </Parallax>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-3xl">
            <Reveal>
              <div className="mb-6 flex items-center gap-2">
                <span className="h-px w-8 bg-foreground/40" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Features
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <h1 className="font-display text-display-lg">
                Everything your business
                <br />
                needs to get paid,
                <br />
                <em className="text-accent">nothing it doesn&apos;t</em>.
              </h1>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-10 max-w-xl text-lg text-muted-foreground">
                JidoPay is a complete payments platform — not a collection of
                disconnected tools. Every feature is designed to work together
                effortlessly.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Feature categories */}
      {FEATURE_CATEGORIES.map((cat, idx) => (
        <section
          key={cat.title}
          className="border-t border-border/60 py-24 lg:py-32"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid gap-16 lg:grid-cols-[1fr_2fr] lg:gap-20">
              <Reveal className="lg:sticky lg:top-32 lg:self-start">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-4 font-display text-display-md">
                  {cat.title}
                </h2>
                <p className="mt-6 max-w-sm text-muted-foreground">
                  {cat.description}
                </p>
              </Reveal>

              <div className="grid gap-8 sm:grid-cols-2">
                {cat.features.map((feature, fIdx) => (
                  <Reveal key={feature.title} delay={fIdx * 0.08}>
                    <div className="group h-full rounded-xl border border-border/60 bg-card p-7 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_12px_40px_-12px_rgba(56,182,255,0.25)]">
                      <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 transition-transform group-hover:scale-110">
                        <feature.icon className="h-5 w-5 text-accent" />
                      </div>
                      <h3 className="font-display text-xl">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="border-t border-border/60 py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-10">
          <Reveal>
            <h2 className="font-display text-display-md">
              See it all in action.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 text-muted-foreground">
              Sign up in under a minute and explore every feature for yourself.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <Link
              href="/sign-up"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
            >
              Get started
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

const FEATURE_CATEGORIES = [
  {
    title: "Accept Payments",
    description:
      "Get paid by your customers — anywhere, anytime, in any currency.",
    features: [
      {
        title: "Payment Links",
        description:
          "Create a branded payment link in seconds. Share it over email, text, or embed it anywhere.",
        icon: Link2,
      },
      {
        title: "Hosted Checkout",
        description:
          "A beautiful, optimized checkout experience that works on every device your customers use.",
        icon: Globe,
      },
      {
        title: "100+ Currencies",
        description:
          "Accept payments in over 100 currencies with automatic conversion to your preferred payout currency.",
        icon: Globe,
      },
      {
        title: "Instant Payouts",
        description:
          "Funds land in your bank account on your schedule — daily, weekly, or on demand.",
        icon: Zap,
      },
    ],
  },
  {
    title: "Invoicing",
    description:
      "Send professional invoices and get paid faster than ever before.",
    features: [
      {
        title: "Professional Invoices",
        description:
          "Branded invoices with line items, taxes, and notes. Every one looks like a boutique agency sent it.",
        icon: FileText,
      },
      {
        title: "Automated Reminders",
        description:
          "Never chase a late payment again. Automated reminders go out on your schedule.",
        icon: Bell,
      },
      {
        title: "Recurring Billing",
        description:
          "Set up subscription-based invoices and let JidoPay handle renewals automatically.",
        icon: RefreshCw,
      },
      {
        title: "Export Anywhere",
        description:
          "Download every invoice as a PDF or CSV for your accounting system.",
        icon: Download,
      },
    ],
  },
  {
    title: "Growth & Retention",
    description:
      "Win customers back, reward loyalty, and turn one-time buyers into regulars.",
    features: [
      {
        title: "SMS & Email Campaigns",
        description:
          "Re-engage inactive customers, repeat buyers, or abandoned checkouts with one-tap SMS and email blasts. Personalization tokens included.",
        icon: Megaphone,
      },
      {
        title: "Abandoned Cart Recovery",
        description:
          "Capture every checkout that didn't convert and bring those buyers back with an SMS or email reminder — automatically tracked.",
        icon: ShoppingCart,
      },
      {
        title: "Customer Wallets",
        description:
          "Offer your customers a stored balance — perfect for store credit, refunds, loyalty rewards, and faster repeat purchases.",
        icon: Wallet,
      },
      {
        title: "One-Click Pay",
        description:
          "Save your returning customers' details so they can check out on a future payment link with a single tap. Higher conversion, less friction.",
        icon: MousePointerClick,
      },
    ],
  },
  {
    title: "Insights & Intelligence",
    description:
      "Understand your business with beautiful analytics and AI-powered insights.",
    features: [
      {
        title: "Real-Time Dashboard",
        description:
          "Revenue, payments, customers, and trends — all updating in real time in one beautiful view.",
        icon: BarChart3,
      },
      {
        title: "AI Assistant",
        description:
          "An assistant that knows your business. Ask anything from revenue analysis to drafting emails.",
        icon: Bot,
      },
      {
        title: "Customer Insights",
        description:
          "Every customer is automatically tracked with lifetime value, payment history, and trends.",
        icon: Users,
      },
      {
        title: "Reporting",
        description:
          "Export any report as CSV with one click. Perfect for bookkeeping and tax season.",
        icon: Download,
      },
    ],
  },
  {
    title: "Security & Trust",
    description:
      "Bank-grade security and compliance, built into every payment.",
    features: [
      {
        title: "End-to-End Encryption",
        description:
          "Every payment is encrypted in transit and at rest with 256-bit AES encryption.",
        icon: Lock,
      },
      {
        title: "PCI DSS Compliance",
        description:
          "We never touch card data. Payments are securely processed by our payment infrastructure partners.",
        icon: Shield,
      },
      {
        title: "Fraud Detection",
        description:
          "Machine learning models block suspicious transactions before they reach your account.",
        icon: Shield,
      },
      {
        title: "Audit Trail",
        description:
          "Every financial action is logged with who, what, and when. Full accountability, always.",
        icon: FileText,
      },
    ],
  },
];
