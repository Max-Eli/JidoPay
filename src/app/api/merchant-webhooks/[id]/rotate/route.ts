import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchantWebhooks, auditLogs } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import {
  generateWebhookSigningSecret,
  maskSigningSecret,
} from "@/lib/merchant-webhooks";

// Rotates the signing secret for a webhook. Returns the new secret once —
// the merchant must immediately update their env var. Old signatures stop
// validating the moment this completes.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(merchantWebhooks)
    .where(
      and(eq(merchantWebhooks.id, id), eq(merchantWebhooks.merchantId, userId))
    );
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newSecret = generateWebhookSigningSecret();
  const [webhook] = await db
    .update(merchantWebhooks)
    .set({ signingSecret: newSecret, updatedAt: new Date() })
    .where(
      and(eq(merchantWebhooks.id, id), eq(merchantWebhooks.merchantId, userId))
    )
    .returning();

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "settings_updated",
    resourceId: id,
    resourceType: "merchant_webhook",
    metadata: JSON.stringify({ action: "webhook_secret_rotated" }),
    ipAddress:
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
  });

  return NextResponse.json({
    webhook: {
      ...webhook,
      signingSecret: undefined,
      signingSecretHint: maskSigningSecret(newSecret),
    },
    signingSecret: newSecret,
  });
}
