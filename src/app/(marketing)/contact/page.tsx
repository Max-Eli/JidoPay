import { Mail, MessageCircle, HelpCircle, Shield } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";

export const metadata = {
  title: "Contact",
  description: "Get in touch with the JidoPay team.",
};

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden py-24 lg:py-32">
        <Parallax
          offset={110}
          className="pointer-events-none absolute -right-48 top-0"
        >
          <div
            aria-hidden
            className="h-[560px] w-[560px] rounded-full bg-accent/20 blur-3xl"
          />
        </Parallax>
        <Parallax
          offset={-90}
          className="pointer-events-none absolute -left-32 bottom-0"
        >
          <div
            aria-hidden
            className="h-[380px] w-[380px] rounded-full bg-foreground/[0.05] blur-3xl"
          />
        </Parallax>
        <div
          aria-hidden
          className="pointer-events-none absolute right-12 top-24 hidden lg:block"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-accent/10 blur-2xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-border/60 bg-card/80 backdrop-blur">
              <Mail className="h-10 w-10 text-accent" strokeWidth={1.25} />
            </div>
          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-3xl">
            <Reveal>
              <div className="mb-6 flex items-center gap-2">
                <span className="h-px w-8 bg-foreground/40" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Contact
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <h1 className="font-display text-display-lg">
                We&apos;re here
                <br />
                to <em className="text-accent">help</em>.
              </h1>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-10 max-w-xl text-lg text-muted-foreground">
                Reach out anytime. We answer every message personally, usually
                within a few hours.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Contact channels */}
      <section className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-px bg-border/60 rounded-2xl overflow-hidden md:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map((c, idx) => (
              <Reveal key={c.title} delay={idx * 0.08}>
                <a
                  href={c.href}
                  className="group block h-full bg-background p-10 transition-all hover:bg-muted/30"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 transition-transform group-hover:scale-110">
                    <c.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-display text-xl">{c.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-accent">
                    {c.cta}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="border-t border-border/60 py-24 lg:py-32">
        <div className="mx-auto max-w-2xl px-6 lg:px-10">
          <Reveal className="text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Send us a message
            </span>
            <h2 className="mt-4 font-display text-display-md">
              Drop us a line.
            </h2>
          </Reveal>

          <Reveal delay={0.15} as="section" className="mt-16">
          <form className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                Subject
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                Message
              </label>
              <textarea
                required
                rows={6}
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-foreground py-4 text-sm font-medium text-background transition-all hover:scale-[1.01] hover:bg-foreground/90"
            >
              Send message
            </button>
          </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    description: "For general questions and inquiries.",
    cta: "hello@jidopay.com",
    href: "mailto:hello@jidopay.com",
  },
  {
    icon: MessageCircle,
    title: "Support",
    description: "Logged-in users can reach us from the dashboard.",
    cta: "Open dashboard",
    href: "/dashboard",
  },
  {
    icon: HelpCircle,
    title: "Sales",
    description: "For partnerships and enterprise inquiries.",
    cta: "sales@jidopay.com",
    href: "mailto:sales@jidopay.com",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Responsible disclosure and security reports.",
    cta: "security@jidopay.com",
    href: "mailto:security@jidopay.com",
  },
];
