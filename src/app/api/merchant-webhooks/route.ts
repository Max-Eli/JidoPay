import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchantWebhooks, auditLogs } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import {
  generateWebhookSigningSecret,
  maskSigningSecret,
} from "@/lib/merchant-webhooks";

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

const createSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .refine((u) => {
      try {
        const parsed = new URL(u);
        // Only allow https in production. http is fine for localhost tests.
        if (process.env.NODE_ENV === "production") return parsed.protocol === "https:";
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    }, "URL must use https://"),
  description: z.string().max(160).optional(),
  enabledEvents: z
    .array(z.enum(ALLOWED_EVENTS))
    .optional()
    .default([]),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(merchantWebhooks)
    .where(eq(merchantWebhooks.merchantId, userId))
    .orderBy(desc(merchantWebhooks.createdAt));

  // Never return the raw signing secret on list — only a masked hint.
  // Merchants can rotate if they lose the one-time reveal.
  return NextResponse.json({
    webhooks: rows.map((w) => ({
      ...w,
      signingSecret: undefined,
      signingSecretHint: maskSigningSecret(w.signingSecret),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const secret = generateWebhookSigningSecret();
  const id = generateId("whk");

  const [webhook] = await db
    .insert(merchantWebhooks)
    .values({
      id,
      merchantId: userId,
      url: parsed.data.url,
      description: parsed.data.description ?? null,
      enabledEvents: parsed.data.enabledEvents,
      signingSecret: secret,
      active: true,
    })
    .returning();

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "settings_updated",
    resourceId: id,
    resourceType: "merchant_webhook",
    metadata: JSON.stringify({ action: "webhook_created", url: parsed.data.url }),
    ipAddress:
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
  });

  // Return the signing secret exactly once — merchants should copy it
  // immediately into their env vars. Subsequent fetches only show the mask.
  return NextResponse.json({
    webhook: {
      ...webhook,
      signingSecretHint: maskSigningSecret(secret),
    },
    signingSecret: secret,
  });
}
