"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Link2,
  Users,
  Settings,
  LogOut,
  Megaphone,
  Wallet,
  ShoppingCart,
  Landmark,
  Store,
  Sparkles,
} from "lucide-react";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/marketing/logo";
import { useMobileNav } from "./dashboard-shell";
import { X } from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/storefront", label: "Storefront", icon: Store },
    ],
  },
  {
    label: "Revenue",
    items: [
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/payment-links", label: "Payment Links", icon: Link2 },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/payouts", label: "Payouts", icon: Landmark },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/recovery", label: "Cart Recovery", icon: ShoppingCart },
      { href: "/wallet", label: "Wallets", icon: Wallet },
      { href: "/ai", label: "AI Assistant", icon: Sparkles },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { open, setOpen } = useMobileNav();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/60 bg-card",
        "transform transition-transform duration-200 ease-out md:translate-x-0",
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}
      aria-hidden={!open ? undefined : false}
    >
      {/* Logo + mobile close */}
      <div className="flex h-20 items-center justify-between border-b border-border/60 px-6">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="-mr-1 flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-8">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href + "/"));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-accent/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        {isActive && (
                          <span
                            aria-hidden
                            className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-accent"
                          />
                        )}
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive
                              ? "text-accent"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-border/60 p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <UserButton
            appearance={{
              variables: { colorPrimary: "#38b6ff" },
              elements: {
                avatarBox: "h-8 w-8 rounded-full ring-1 ring-border",
              },
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {user?.fullName ?? user?.firstName ?? "Your account"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress ?? "Manage profile"}
            </p>
          </div>
        </div>
        <SignOutButton redirectUrl="/">
          <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground">
            <LogOut className="h-4 w-4 shrink-0 transition-colors group-hover:text-accent" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
