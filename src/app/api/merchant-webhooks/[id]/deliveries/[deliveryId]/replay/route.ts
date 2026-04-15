import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchantWebhooks, webhookDeliveries } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { attemptDelivery } from "@/lib/merchant-webhooks";

// Replay a previous delivery with the exact same payload and event id.
// Resets the status to retrying and kicks off a fresh attempt so the
// delivery shows up as a new attempt in the log without losing history.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, deliveryId } = await params;

  const [webhook] = await db
    .select()
    .from(merchantWebhooks)
    .where(
      and(eq(merchantWebhooks.id, id), eq(merchantWebhooks.merchantId, userId))
    );
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(
      and(
        eq(webhookDeliveries.id, deliveryId),
        eq(webhookDeliveries.webhookId, id)
      )
    );
  if (!delivery) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

  // Reset to retrying and clear the backoff so attemptDelivery runs now.
  // We intentionally don't reset `attempts` — the history is preserved,
  // but the next attempt gets a fresh retry budget via nextRetryAt=null.
  await db
    .update(webhookDeliveries)
    .set({
      status: "retrying",
      nextRetryAt: null,
      errorMessage: null,
    })
    .where(eq(webhookDeliveries.id, deliveryId));

  attemptDelivery(deliveryId, webhook).catch((err) => {
    console.error("[webhook] replay attempt failed", err);
  });

  return NextResponse.json({ ok: true });
}
