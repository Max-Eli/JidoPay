import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amountInCents: number,
  currency = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountInCents / 100);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function generateId(prefix = ""): string {
  const rand = Math.random().toString(36).substring(2, 11);
  const time = Date.now().toString(36);
  return prefix ? `${prefix}_${time}${rand}` : `${time}${rand}`;
}

export function generateInvoiceNumber(existing: number): string {
  return `INV-${String(existing + 1).padStart(5, "0")}`;
}

/** Stripe stores amounts in cents. Convert dollars → cents. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Platform application fee in cents. Minimum 1 cent.
 *
 * Direct charges on the connected account already subtract Stripe's
 * ~2.9% + $0.30 processing fee. Charging an additional 0.6% brings the
 * merchant's total cost to the advertised 3.5% + $0.30.
 */
export function calculateApplicationFee(amountInCents: number): number {
  return Math.max(1, Math.round(amountInCents * 0.006));
}
