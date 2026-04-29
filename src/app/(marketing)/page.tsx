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
  MessageCircle,
  TrendingUp,
  Send,
  Store,
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
              Storefront, payments,
              <br />
              and <em className="text-accent">customer retention</em>.
              <br />
              One platform.
            </h1>
          </Reveal>

          <Reveal delay={0.24}>
            <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Everything new businesses need to launch and grow online —
              storefront, payment links, invoicing, and built-in customer
              retargeting in a single platform.
            </p>
          </Reveal>

          <Reveal delay={0.36}>
            <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90"
              >
                Start your business
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
            <div className="font-display text-4xl md:text-5xl">$0</div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              Monthly fee
            </div>
          </Reveal>
          <Reveal direction="up" delay={0.1} className="px-6 py-10 md:px-10">
            <div className="font-display text-4xl md:text-5xl">All-in-one</div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              Business platform
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

      {/* ─── Storefront ────────────────────────────────────────────── */}
      <section className="py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Copy — left */}
            <div>
              <Reveal direction="right">
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-px w-8 bg-foreground/40" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Storefront
                  </span>
                </div>
              </Reveal>
              <Reveal direction="right" delay={0.1}>
                <h2 className="font-display text-display-lg">
                  Your shop.
                  <br />
                  Your URL.
                  <br />
                  <em className="text-accent">Live in minutes</em>.
                </h2>
              </Reveal>
              <Reveal direction="right" delay={0.2}>
                <p className="mt-8 max-w-md text-muted-foreground">
                  Launch a hosted storefront at jidopay.com/shop/your-handle.
                  Every product you add is listed automatically — no website
                  to build, no code to write. Share one link and start taking
                  orders.
                </p>
              </Reveal>
              <ul className="mt-8 space-y-3">
                {STOREFRONT_CAPABILITIES.map((item, idx) => (
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

            {/* Mock — right */}
            <Reveal direction="left" delay={0.15}>
              <div className="relative">
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_24px_80px_-20px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-1">
                  {/* Browser-ish URL bar */}
                  <div className="mb-6 flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      jidopay.com/shop/yourstore
                    </span>
                  </div>

                  {/* Storefront header */}
                  <div className="mb-6 border-b border-border/40 pb-5 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                      <Store className="h-4 w-4 text-accent" />
                    </div>
                    <div className="font-display text-lg">Your Store</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Handcrafted goods, shipped weekly
                    </div>
                  </div>

                  {/* Product grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Espresso Blend", price: "$24" },
                      { name: "Cold Brew", price: "$18" },
                      { name: "Tasting Set", price: "$48" },
                      { name: "Subscription", price: "$120/mo" },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className="rounded-xl border border-border/60 bg-background p-3"
                      >
                        <div className="mb-3 h-16 rounded-md bg-muted/60" />
                        <div className="font-display text-xs">{p.name}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {p.price}
                          </span>
                          <span className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-background">
                            Buy
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating "Live" badge */}
                <div className="absolute -right-4 -top-4 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)]">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>
            </Reveal>
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

      {/* ─── Abandoned cart recovery ───────────────────────────────── */}
      <section className="border-t border-border/60 bg-muted/30 py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Mock — left */}
            <Reveal direction="right" delay={0.15} className="order-2 lg:order-1">
              <div className="relative mx-auto w-full max-w-sm">
                {/* Phone frame */}
                <div className="relative rounded-[2.5rem] border border-border/60 bg-card p-3 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.2)]">
                  <div className="rounded-[2rem] border border-border/40 bg-background p-6">
                    {/* Phone header */}
                    <div className="flex items-center justify-between pb-4">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        9:41
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                        <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                        <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="mb-5 border-b border-border/40 pb-4 text-center">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                        <MessageCircle className="h-4 w-4 text-accent" />
                      </div>
                      <div className="font-display text-sm">Your Store</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        +1 (555) 012-3456
                      </div>
                    </div>

                    {/* SMS bubble */}
                    <div className="space-y-3">
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-xs leading-relaxed">
                        Hi Sarah — we saved the cart you started earlier today.
                        Your items are still waiting. Tap to finish in one click:
                        <br />
                        <span className="mt-1 block text-accent underline">
                          jidopay.com/r/4f2a
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Delivered · just now
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating stat badge */}
                <div className="absolute -right-4 -top-4 rounded-2xl border border-border bg-background px-4 py-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)]">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Recovered
                  </div>
                  <div className="mt-1 font-display text-xl">+$4,280</div>
                </div>
              </div>
            </Reveal>

            {/* Copy — right */}
            <div className="order-1 lg:order-2">
              <Reveal direction="left">
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-px w-8 bg-foreground/40" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Recovery
                  </span>
                </div>
              </Reveal>
              <Reveal direction="left" delay={0.1}>
                <h2 className="font-display text-display-lg">
                  Every lost
                  <br />
                  checkout.
                  <br />
                  <em className="text-accent">Recovered</em>.
                </h2>
              </Reveal>
              <Reveal direction="left" delay={0.2}>
                <p className="mt-8 max-w-md text-muted-foreground">
                  When a customer abandons a cart, JidoPay captures it
                  automatically and sends a considered SMS reminder that brings
                  them back — with a one-tap link to finish what they started.
                </p>
              </Reveal>
              <ul className="mt-8 space-y-3">
                {RECOVERY_CAPABILITIES.map((item, idx) => (
                  <Reveal key={item} delay={0.3 + idx * 0.08} direction="left" as="li">
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
          </div>
        </div>
      </section>

      {/* ─── Customer wallets ──────────────────────────────────────── */}
      <section className="py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Copy — left */}
            <div>
              <Reveal direction="right">
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-px w-8 bg-foreground/40" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Wallets & one-click pay
                  </span>
                </div>
              </Reveal>
              <Reveal direction="right" delay={0.1}>
                <h2 className="font-display text-display-lg">
                  Loyalty, stored
                  <br />
                  <em className="text-accent">beautifully</em>.
                </h2>
              </Reveal>
              <Reveal direction="right" delay={0.2}>
                <p className="mt-8 max-w-md text-muted-foreground">
                  Offer your best customers a branded stored balance for store
                  credit, refunds, and loyalty rewards. Returning customers
                  check out in a single tap — higher conversion, less friction.
                </p>
              </Reveal>
              <ul className="mt-8 space-y-3">
                {WALLET_CAPABILITIES.map((item, idx) => (
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

            {/* Mock — right */}
            <Reveal direction="left" delay={0.15}>
              <div className="relative">
                {/* Wallet card */}
                <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_24px_80px_-20px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-1">
                  <div className="mb-8 flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Customer wallet
                      </div>
                      <div className="mt-1 font-display text-lg">Sarah Chen</div>
                      <div className="text-xs text-muted-foreground">
                        sarah@example.com
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                      <Wallet className="h-4 w-4 text-accent" />
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Balance
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-5xl">$128.40</span>
                      <span className="text-xs text-muted-foreground">USD</span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border/60 pt-5">
                    {[
                      { type: "Top-up", amount: "+$50.00", color: "text-emerald-500" },
                      { type: "Payment", amount: "−$12.00", color: "text-foreground" },
                      { type: "Refund credit", amount: "+$25.00", color: "text-emerald-500" },
                    ].map((row) => (
                      <div
                        key={row.type}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground">{row.type}</span>
                        <span className={`font-mono ${row.color}`}>
                          {row.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating one-click badge */}
                <div className="absolute -left-4 -bottom-4 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)]">
                  <MousePointerClick className="h-3.5 w-3.5 text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    One-click pay
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Campaigns ─────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30 py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Mock — left */}
            <Reveal direction="right" delay={0.15} className="order-2 lg:order-1">
              <div className="relative">
                {/* Campaign stats card */}
                <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_24px_80px_-20px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-1">
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Campaign active
                      </span>
                    </div>
                    <Megaphone className="h-4 w-4 text-accent" />
                  </div>

                  <div>
                    <div className="font-display text-xl">
                      Winter reactivation
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      SMS · Inactive customers · 30 days
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    {[
                      { label: "Sent", value: "247" },
                      { label: "Opened", value: "182" },
                      { label: "Recovered", value: "$4.2k" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-border/60 bg-background p-4"
                      >
                        <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {stat.label}
                        </div>
                        <div className="mt-1 font-display text-xl">
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Delivery rate</span>
                      <span className="font-mono">96.4%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: "96.4%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Floating ROI badge */}
                <div className="absolute -right-4 -top-4 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)]">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      ROI
                    </div>
                    <div className="font-display text-base leading-none">
                      17.3×
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Copy — right */}
            <div className="order-1 lg:order-2">
              <Reveal direction="left">
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-px w-8 bg-foreground/40" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Campaigns
                  </span>
                </div>
              </Reveal>
              <Reveal direction="left" delay={0.1}>
                <h2 className="font-display text-display-lg">
                  Bring them
                  <br />
                  <em className="text-accent">back</em>.
                </h2>
              </Reveal>
              <Reveal direction="left" delay={0.2}>
                <p className="mt-8 max-w-md text-muted-foreground">
                  Re-engage inactive customers, reward repeat buyers, or recover
                  abandoned checkouts — all with one-tap SMS and email blasts.
                  Beautifully composed, precisely targeted, measured in real time.
                </p>
              </Reveal>
              <ul className="mt-8 space-y-3">
                {CAMPAIGN_CAPABILITIES.map((item, idx) => (
                  <Reveal key={item} delay={0.3 + idx * 0.08} direction="left" as="li">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10">
                        <Send className="h-2.5 w-2.5 text-accent" />
                      </div>
                      {item}
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border/60 bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-6 py-32 text-center lg:px-10 lg:py-40">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-display-lg">
                Ready to
                <br />
                <em className="text-accent">launch</em>?
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mx-auto mt-8 max-w-xl text-background/70">
                Join the businesses building on JidoPay. No monthly fees. No
                setup. Your storefront, payments, and growth tools — all in
                one platform.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 rounded-full bg-background px-8 py-4 text-sm font-medium text-foreground transition-all hover:scale-[1.02] hover:bg-background/90"
                >
                  Start your business
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

const STOREFRONT_CAPABILITIES = [
  "Branded URL with your business handle",
  "Auto-syncs with every product you add",
  "Mobile-first and conversion-optimized",
  "No website needed — share one link",
];

const AI_CAPABILITIES = [
  "Analyze revenue trends in plain English",
  "Draft follow-up emails for overdue invoices",
  "Write professional customer messages",
  "Suggest pricing strategies based on your data",
];

const RECOVERY_CAPABILITIES = [
  "Every abandoned checkout captured automatically",
  "Personalized SMS with the customer's name",
  "One-tap recovery link, no retyping",
  "Real-time status from pending to recovered",
];

const WALLET_CAPABILITIES = [
  "Optional, opt-in per merchant",
  "Perfect for store credit and refunds",
  "Full audit trail for every transaction",
  "Returning customers check out in one tap",
];

const CAMPAIGN_CAPABILITIES = [
  "Target inactive, repeat, or abandoned audiences",
  "Personalization tokens for name and business",
  "Live delivery and recovery stats",
  "Send by SMS, email, or both",
];
