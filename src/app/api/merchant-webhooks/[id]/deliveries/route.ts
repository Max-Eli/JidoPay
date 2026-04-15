import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchantWebhooks, webhookDeliveries } from "@/lib/db";
import { and, desc, eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Confirm ownership before listing deliveries — otherwise a merchant
  // could list deliveries for somebody else's webhook.
  const [webhook] = await db
    .select()
    .from(merchantWebhooks)
    .where(
      and(eq(merchantWebhooks.id, id), eq(merchantWebhooks.merchantId, userId))
    );
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const limit = Math.min(
    100,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 25))
  );

  const rows = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, id))
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(limit);

  return NextResponse.json({ deliveries: rows });
}
