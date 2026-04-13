import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  db,
  wallets,
  walletTransactions,
  customers,
  merchants,
  auditLogs,
} from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { getRatelimit } from "@/lib/ratelimit";

const creditSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().int().min(1), // cents
  type: z.enum(["credit", "debit"]).default("credit"),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = getRatelimit();
  const { success } = await rl.limit(userId);
  if (!success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant?.walletEnabled) {
    return NextResponse.json(
      { error: "Wallet feature is not enabled" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = creditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { customerId, amount, type, note } = parsed.data;

  // Tenant-scoped customer lookup — never trust the client's customerId alone.
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.merchantId, userId)));

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Upsert wallet row
  let [wallet] = await db
    .select()
    .from(wallets)
    .where(
      and(eq(wallets.merchantId, userId), eq(wallets.customerId, customerId))
    );

  if (!wallet) {
    [wallet] = await db
      .insert(wallets)
      .values({
        id: generateId("wlt"),
        merchantId: userId,
        customerId,
        balance: 0,
        currency: "usd",
      })
      .returning();
  }

  if (type === "debit" && wallet.balance < amount) {
    return NextResponse.json(
      { error: "Insufficient wallet balance" },
      { status: 400 }
    );
  }

  const delta = type === "credit" ? amount : -amount;
  const newBalance = wallet.balance + delta;

  await db
    .update(wallets)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(wallets.id, wallet.id));

  await db.insert(walletTransactions).values({
    id: generateId("wtx"),
    walletId: wallet.id,
    merchantId: userId,
    type,
    amount,
    balanceAfter: newBalance,
    note: note ?? null,
  });

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: type === "credit" ? "wallet_credited" : "wallet_debited",
    resourceId: wallet.id,
    resourceType: "wallet",
    // Capture before/after balance so a compromised session's activity
    // can be fully reconstructed for dispute/chargeback resolution.
    metadata: JSON.stringify({
      customerId,
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: newBalance,
      note,
    }),
    ipAddress:
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      null,
  });

  return NextResponse.json({ ok: true, balance: newBalance });
}

