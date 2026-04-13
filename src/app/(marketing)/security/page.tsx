import Link from "next/link";
import {
  Shield,
  Lock,
  Eye,
  Server,
  FileCheck,
  AlertTriangle,
  Key,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

export const metadata = {
  title: "Security",
  description:
    "Your customers trust you with their payment data. We take that seriously.",
};

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-3xl">
            <Reveal>
              <div className="mb-6 flex items-center gap-2">
                <span className="h-px w-8 bg-foreground/40" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Security & Trust
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <h1 className="font-display text-display-lg">
                Security isn&apos;t a
                <br />
                feature. It&apos;s the
                <br />
                <em className="text-accent">foundation</em>.
              </h1>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-10 max-w-xl text-lg text-muted-foreground">
                Your customers trust you with their money. You trust us with
                theirs. We take that responsibility seriously — and built JidoPay
                with security baked into every layer.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-t border-border/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal className="mb-16 max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Our principles
            </span>
            <h2 className="mt-4 font-display text-display-md">
              Four pillars of security.
            </h2>
          </Reveal>

          <div className="grid gap-px bg-border/60 rounded-2xl overflow-hidden md:grid-cols-2">
            {PRINCIPLES.map((p, idx) => (
              <Reveal key={p.title} delay={idx * 0.1}>
                <div className="group h-full bg-background p-10 transition-colors hover:bg-muted/30">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 transition-transform group-hover:scale-110">
                    <p.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-display text-2xl">{p.title}</h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="border-t border-border/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
            <Reveal className="lg:sticky lg:top-32 lg:self-start">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Controls
              </span>
              <h2 className="mt-4 font-display text-display-md">
                How we protect
                <br />
                your data.
              </h2>
              <p className="mt-6 max-w-sm text-muted-foreground">
                Every piece of infrastructure is chosen for security first,
                convenience second.
              </p>
            </Reveal>

            <div className="space-y-8">
              {CONTROLS.map((c, idx) => (
                <Reveal key={c.title} delay={idx * 0.08}>
                  <div className="grid grid-cols-[auto_1fr] gap-6 border-t border-border/60 pt-8 first:border-t-0 first:pt-0">
                    <div className="font-mono text-xs text-muted-foreground">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl">{c.title}</h3>
                      <p className="mt-3 text-muted-foreground leading-relaxed">
                        {c.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance badges */}
      <section className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <Reveal className="text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Compliance
            </span>
            <h2 className="mt-4 font-display text-display-md">
              Certified and compliant.
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {COMPLIANCE.map((c, idx) => (
              <Reveal key={c.title} delay={idx * 0.1}>
                <div className="group h-full rounded-2xl border border-border/60 bg-card p-8 text-center transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_12px_40px_-12px_rgba(56,182,255,0.25)]">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 transition-transform group-hover:scale-110">
                    <c.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-display text-xl">{c.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Disclosure */}
      <section className="border-t border-border/60 py-24">
        <Reveal className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <AlertTriangle className="mx-auto mb-6 h-6 w-6 text-accent" />
          <h2 className="font-display text-display-sm">
            Found a security issue?
          </h2>
          <p className="mt-6 text-muted-foreground">
            We take all reports seriously and respond within 24 hours. Please
            reach out privately so we can investigate and patch before public
            disclosure.
          </p>
          <Link
            href="/contact"
            className="group mt-8 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-all hover:scale-[1.02] hover:bg-muted"
          >
            Responsible disclosure
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}

const PRINCIPLES = [
  {
    icon: Lock,
    title: "Defense in depth",
    description:
      "Every layer of our platform — from the database to the browser — has its own security controls. A breach in one layer doesn't compromise the others.",
  },
  {
    icon: Eye,
    title: "Zero trust by default",
    description:
      "Every request is verified, every action is authenticated, every privilege is explicit. Nothing is trusted just because it's internal.",
  },
  {
    icon: Key,
    title: "Never touch sensitive data",
    description:
      "Card details, bank credentials, and identity documents never pass through our servers. They go directly to our certified payment infrastructure partners.",
  },
  {
    icon: FileCheck,
    title: "Continuous auditing",
    description:
      "Every financial action is logged with immutable audit trails. Every code change is reviewed. Every deploy is tracked.",
  },
];

const CONTROLS = [
  {
    title: "End-to-end encryption",
    description:
      "All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Encryption keys are rotated regularly and stored in hardware security modules.",
  },
  {
    title: "Multi-factor authentication",
    description:
      "MFA is available on every account and can be required for your entire team. We support authenticator apps, SMS, and hardware security keys.",
  },
  {
    title: "Rate limiting & abuse protection",
    description:
      "Every endpoint is protected against abuse with intelligent rate limiting. Suspicious patterns are automatically blocked and flagged for review.",
  },
  {
    title: "Webhook signature verification",
    description:
      "Every payment event is cryptographically signed and verified. Replays, forgeries, and tampering are detected and rejected.",
  },
  {
    title: "Row-level data isolation",
    description:
      "Your business data is logically isolated from every other merchant. No query, no API call, no code path can return another merchant's information.",
  },
  {
    title: "Automated vulnerability scanning",
    description:
      "Dependencies are scanned continuously for known vulnerabilities. Critical patches are deployed within hours of discovery.",
  },
];

const COMPLIANCE = [
  {
    icon: Shield,
    title: "PCI DSS",
    description: "Payment Card Industry Data Security Standard",
  },
  {
    icon: Server,
    title: "SOC 2 aligned",
    description: "Systems & Organization Controls",
  },
  {
    icon: Users,
    title: "GDPR ready",
    description: "European data protection compliance",
  },
];
