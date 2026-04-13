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
 * Platform application fee in cents.
 *
 * On direct charges, Stripe already keeps 2.9% + $0.30 of the gross
 * amount. To land on the advertised total of 3.5% + $0.30, our platform
 * fee must equal the remaining 0.6% of the gross — computed on the full
 * amount, not the net, because Stripe's 2.9% applies to gross too.
 *
 *   gross * 0.029 + 30  →  Stripe
 *   gross * 0.006       →  JidoPay
 *   gross * 0.965 - 30  →  Merchant take-home
 *
 * Minimum 1 cent so Stripe never rejects the fee as zero.
 */
export function calculateApplicationFee(amountInCents: number): number {
  return Math.max(1, Math.round(amountInCents * 0.006));
}
