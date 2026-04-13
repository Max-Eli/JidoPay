"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent"
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="px-4 py-2 text-[13px] font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[13px] font-medium text-background transition-all hover:bg-foreground/90"
            >
              Get started
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 -mr-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-20 z-40 bg-background md:hidden">
          <nav className="flex flex-col p-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-border/60 py-5 font-display text-3xl"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/sign-in"
                className="rounded-full border border-border px-6 py-3 text-center text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-foreground px-6 py-3 text-center text-sm font-medium text-background"
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
