"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { AiWidget } from "./ai-widget";
import { Toaster } from "@/components/ui/toaster";

// Shared drawer state for the mobile nav. The Topbar publishes open events
// via the hamburger button; the Sidebar consumes `open` to slide itself in
// and the shell renders a backdrop over the main content. Desktop (md+)
// ignores the state entirely — the sidebar is always visible.
type MobileNavState = {
  open: boolean;
  setOpen: (value: boolean) => void;
};

const MobileNavContext = createContext<MobileNavState | null>(null);

export function useMobileNav(): MobileNavState {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error(
      "useMobileNav must be used inside <DashboardShell>."
    );
  }
  return ctx;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer when the route changes so tapping a nav link also
  // dismisses the overlay. Without this, the drawer would stay open over
  // the newly navigated page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock the body scroll while the drawer is open so swiping the backdrop
  // doesn't scroll the page underneath.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      <div data-app-ui className="min-h-screen bg-background text-foreground">
        {open && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
        <Sidebar />
        <main className="md:pl-64">{children}</main>
        <AiWidget />
        <Toaster />
      </div>
    </MobileNavContext.Provider>
  );
}
