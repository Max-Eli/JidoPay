import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db, campaignMessages, campaigns } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Resend sends webhooks through Svix, so the signature format is
 *   svix-id: msg_xxx
 *   svix-timestamp: 1712345678
 *   svix-signature: v1,<base64(hmacSha256(secret, `${id}.${timestamp}.${body}`))>
 *
 * We verify manually rather than pulling the svix package to keep this
 * runtime light. The secret is stored as `whsec_<base64>` in Resend's
 * dashboard — strip the prefix before using it as the HMAC key.
 */
function verifySvixSignature(
  rawBody: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignatureHeader: string | null,
  secret: string
): boolean {
  if (!svixId || !svixTimestamp || !svixSignatureHeader) return false;

  // Reject events whose timestamp is more than 5 minutes off — Svix's
  // own convention, guards against replay.
  const now = Math.floor(Date.now() / 1000);
  const ts = Number.parseInt(svixTimestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 5 * 60) return false;

  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret,
    "base64"
  );

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes)
    .update(signedPayload)
    .digest("base64");

  // Header can carry multiple signatures, space-separated: `v1,abc v1,def`.
  // Any valid v1 match passes.
  const sigs = svixSignatureHeader
    .split(" ")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("v1,"))
    .map((s) => s.slice(3));

  for (const candidate of sigs) {
    try {
      const a = Buffer.from(candidate, "base64");
      const b = Buffer.from(expected, "base64");
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

// Shape of the Resend event payloads we care about. Resend ships the
// message id under `data.email_id`, and our internal row id is threaded
// through as a tag so we can find the row even if provider ids are stale.
type ResendEvent = {
  type: string;
  created_at?: string;
  data: {
    email_id?: string;
    tags?: Array<{ name: string; value: string }> | Record<string, string>;
  };
};

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (secret) {
    const ok = verifySvixSignature(
      rawBody,
      req.headers.get("svix-id"),
      req.headers.get("svix-timestamp"),
      req.headers.get("svix-signature"),
      secret
    );
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Pull both the provider id and our own row id (tagged at send time).
  const providerMessageId = event.data?.email_id ?? null;
  const rowIdTag = extractTag(event.data?.tags, "message_row_id");
  const campaignIdTag = extractTag(event.data?.tags, "campaign_id");

  // Prefer tag-based lookup (constant time, immune to provider id quirks),
  // fall back to provider id.
  let message: typeof campaignMessages.$inferSelect | undefined;
  if (rowIdTag) {
    [message] = await db
      .select()
      .from(campaignMessages)
      .where(eq(campaignMessages.id, rowIdTag));
  }
  if (!message && providerMessageId) {
    [message] = await db
      .select()
      .from(campaignMessages)
      .where(eq(campaignMessages.providerMessageId, providerMessageId));
  }

  if (!message) {
    // Not ours (or the row hasn't finished inserting yet). 200-OK either
    // way — Resend retries on non-2xx, and we don't want replay storms
    // for events we genuinely can't route.
    return NextResponse.json({ received: true, matched: false });
  }

  await applyEvent(message, event.type, campaignIdTag);

  return NextResponse.json({ received: true, matched: true });
}

function extractTag(
  tags: ResendEvent["data"]["tags"],
  name: string
): string | null {
  if (!tags) return null;
  if (Array.isArray(tags)) {
    return tags.find((t) => t.name === name)?.value ?? null;
  }
  return tags[name] ?? null;
}

async function applyEvent(
  message: typeof campaignMessages.$inferSelect,
  type: string,
  campaignIdFallback: string | null
) {
  const campaignId = message.campaignId ?? campaignIdFallback;
  const now = new Date();

  switch (type) {
    case "email.delivered": {
      // Only advance forward — don't regress past an opened/clicked state.
      if (
        message.status === "sent" ||
        message.status === "queued"
      ) {
        await db
          .update(campaignMessages)
          .set({
            status: "delivered",
            deliveredAt: now,
            updatedAt: now,
          })
          .where(eq(campaignMessages.id, message.id));
        if (campaignId) {
          await db
            .update(campaigns)
            .set({
              deliveredCount: sql`${campaigns.deliveredCount} + 1`,
              updatedAt: now,
            })
            .where(eq(campaigns.id, campaignId));
        }
      }
      break;
    }
    case "email.opened": {
      const newOpenCount = message.openCount + 1;
      const firstOpen = message.firstOpenedAt ?? now;
      const isFirstOpen = !message.firstOpenedAt;
      const nextStatus =
        message.status === "clicked" ? message.status : "opened";
      await db
        .update(campaignMessages)
        .set({
          status: nextStatus,
          openCount: newOpenCount,
          firstOpenedAt: firstOpen,
          updatedAt: now,
        })
        .where(eq(campaignMessages.id, message.id));
      if (isFirstOpen && campaignId) {
        await db
          .update(campaigns)
          .set({
            openedCount: sql`${campaigns.openedCount} + 1`,
            updatedAt: now,
          })
          .where(eq(campaigns.id, campaignId));
      }
      break;
    }
    case "email.clicked": {
      const newClickCount = message.clickCount + 1;
      const firstClick = message.firstClickedAt ?? now;
      const isFirstClick = !message.firstClickedAt;
      await db
        .update(campaignMessages)
        .set({
          status: "clicked",
          clickCount: newClickCount,
          firstClickedAt: firstClick,
          updatedAt: now,
        })
        .where(eq(campaignMessages.id, message.id));
      if (isFirstClick && campaignId) {
        await db
          .update(campaigns)
          .set({
            clickedCount: sql`${campaigns.clickedCount} + 1`,
            updatedAt: now,
          })
          .where(eq(campaigns.id, campaignId));
      }
      break;
    }
    case "email.bounced": {
      await db
        .update(campaignMessages)
        .set({
          status: "bounced",
          updatedAt: now,
        })
        .where(eq(campaignMessages.id, message.id));
      if (campaignId) {
        await db
          .update(campaigns)
          .set({
            bouncedCount: sql`${campaigns.bouncedCount} + 1`,
            updatedAt: now,
          })
          .where(eq(campaigns.id, campaignId));
      }
      break;
    }
    case "email.complained": {
      await db
        .update(campaignMessages)
        .set({
          status: "complained",
          updatedAt: now,
        })
        .where(eq(campaignMessages.id, message.id));
      if (campaignId) {
        await db
          .update(campaigns)
          .set({
            complainedCount: sql`${campaigns.complainedCount} + 1`,
            updatedAt: now,
          })
          .where(eq(campaigns.id, campaignId));
      }
      break;
    }
    default:
      // Unhandled event types are fine — we record nothing.
      break;
  }
}

