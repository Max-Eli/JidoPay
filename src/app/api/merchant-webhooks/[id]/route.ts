import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchantWebhooks, auditLogs } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { maskSigningSecret } from "@/lib/merchant-webhooks";

const ALLOWED_EVENTS = [
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "payment_link.created",
  "checkout.session.completed",
  "checkout.session.expired",
  "subscription.created",
  "subscription.canceled",
] as const;

const updateSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .refine((u) => {
      try {
        const parsed = new URL(u);
        if (process.env.NODE_ENV === "production") return parsed.protocol === "https:";
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    }, "URL must use https://")
    .optional(),
  description: z.string().max(160).nullable().optional(),
  enabledEvents: z.array(z.enum(ALLOWED_EVENTS)).optional(),
  active: z.boolean().optional(),
});

export async function GET(
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

  return NextResponse.json({
    webhook: {
      ...webhook,
      signingSecret: undefined,
      signingSecretHint: maskSigningSecret(webhook.signingSecret),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const [before] = await db
    .select()
    .from(merchantWebhooks)
    .where(
      and(eq(merchantWebhooks.id, id), eq(merchantWebhooks.merchantId, userId))
    );
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [webhook] = await db
    .update(merchantWebhooks)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
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
    metadata: JSON.stringify({ action: "webhook_updated", changes: parsed.data }),
    ipAddress:
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
  });

  return NextResponse.json({
    webhook: {
      ...webhook,
      signingSecret: undefined,
      signingSecretHint: maskSigningSecret(webhook.signingSecret),
    },
  });
}

export async function DELETE(
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

  await db
    .delete(merchantWebhooks)
    .where(
      and(eq(merchantWebhooks.id, id), eq(merchantWebhooks.merchantId, userId))
    );

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "settings_updated",
    resourceId: id,
    resourceType: "merchant_webhook",
    metadata: JSON.stringify({ action: "webhook_deleted", url: existing.url }),
    ipAddress:
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
  });

  return NextResponse.json({ ok: true });
}
