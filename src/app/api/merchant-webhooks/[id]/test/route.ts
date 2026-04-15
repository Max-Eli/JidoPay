import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchantWebhooks } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { dispatchMerchantWebhook } from "@/lib/merchant-webhooks";

// Sends a synthetic payment.succeeded event to this endpoint so the merchant
// can verify their signature-verification code end-to-end. Runs through the
// exact same dispatch path as real events, including signing and retry, so
// the delivery shows up in the log alongside production traffic.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [webhook] = await db
    .select()
    .from(merchantWebhooks)
    .where(
      and(eq(merchantWebhooks.id, id), eq(merchantWebhooks.merchantId, userId))
    );
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await dispatchMerchantWebhook({
    merchantId: userId,
    event: "payment.succeeded",
    data: {
      test: true,
      paymentIntentId: "pi_test_" + Math.random().toString(36).slice(2, 10),
      amount: 1000,
      currency: "usd",
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      metadata: { source: "jidopay_test_send" },
      description: "Test event from JidoPay dashboard",
    },
  });

  return NextResponse.json({ ok: true });
}
