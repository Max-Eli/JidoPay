import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

export const metadata = {
  title: "About",
  description:
    "The story behind JidoPay and the team building modern payments infrastructure.",
};

export default function AboutPage() {
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
                  Our story
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <h1 className="font-display text-display-lg">
                Building the
                <br />
                payments platform
                <br />
                <em className="text-accent">we wanted</em> to use.
              </h1>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Editorial letter */}
      <section className="border-t border-border/60 py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <div className="space-y-8 text-lg leading-relaxed text-foreground/90">
            <Reveal>
              <p className="font-display text-2xl leading-snug text-foreground">
                Every payment platform feels like it was built by engineers, for
                engineers. We wanted to build one that feels like it was built by
                people, for people running actual businesses.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p>
                JidoPay began with a simple observation: accepting payments online
                has never been harder to do well. The tools exist, but they&apos;re
                scattered across a dozen different services. The dashboards are
                cluttered. The documentation is dense. The experience of running
                a modern business feels, frankly, beneath the businesses that
                deserve better.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p>
                So we set out to build something different. A platform that feels
                as considered as the businesses using it. Where every interaction
                respects your time. Where security isn&apos;t a checkbox — it&apos;s
                the foundation. Where design isn&apos;t decoration — it&apos;s how
                we communicate that we care.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p>
                We&apos;re obsessed with craft. With the tiny details other
                platforms overlook. With making a tool you don&apos;t just
                tolerate, but genuinely enjoy using. Every week. Every payment.
                Every customer.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="text-foreground">
                If you&apos;re building something worth building, we want to help
                you get paid for it.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-12 font-display text-xl italic text-muted-foreground">
                — The JidoPay team
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border/60 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal className="mb-16 max-w-xl">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              What we value
            </span>
            <h2 className="mt-4 font-display text-display-md">
              The principles
              <br />
              that guide us.
            </h2>
          </Reveal>

          <div className="grid gap-px bg-border/60 rounded-2xl overflow-hidden md:grid-cols-3">
            {VALUES.map((v, idx) => (
              <Reveal key={v.title} delay={idx * 0.12}>
                <div className="group h-full bg-background p-10 transition-colors hover:bg-muted/30">
                  <div className="font-mono text-xs text-muted-foreground">
                    {v.number}
                  </div>
                  <h3 className="mt-4 font-display text-2xl transition-colors group-hover:text-accent">
                    {v.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 py-32">
        <Reveal className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h2 className="font-display text-display-md">
            Join us.
          </h2>
          <p className="mt-6 text-muted-foreground">
            We&apos;re building JidoPay for businesses like yours. Try it today
            and tell us what you think.
          </p>
          <Link
            href="/sign-up"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
          >
            Start accepting payments
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}

const VALUES = [
  {
    number: "01",
    title: "Craft",
    description:
      "We believe the quality of your tools shapes the quality of your work. Every detail matters, from the weight of a button to the cadence of an email.",
  },
  {
    number: "02",
    title: "Trust",
    description:
      "Money requires trust. We earn it by being transparent about our pricing, our security, our practices — and by never surprising you.",
  },
  {
    number: "03",
    title: "Respect",
    description:
      "Your time, your data, and your business deserve respect. We don't waste any of them. No dark patterns, no upsells, no gimmicks.",
  },
];
