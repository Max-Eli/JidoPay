import Link from "next/link";
import { Logo } from "./logo";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-16 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          {/* Brand */}
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Payments infrastructure for modern businesses. Made with care.
            </p>
          </div>

          {/* Columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-5 text-xs uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} JidoPay, Inc. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Payments securely processed by our infrastructure partners. Based in the United States.
          </p>
        </div>
      </div>
    </footer>
  );
}
