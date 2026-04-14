import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  db,
  campaigns,
  campaignMessages,
  customers,
  merchants,
  auditLogs,
  abandonedCheckouts,
} from "@/lib/db";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { sendSms, isTwilioConfigured } from "@/lib/twilio";
import { generateId } from "@/lib/utils";
import { getCampaignRatelimit } from "@/lib/ratelimit";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe";

// Hard cap: the largest single campaign blast we're willing to process
// inline. Anything above this should be paginated into a background job.
// At 10k SMS at ~$0.0079/msg that's ~$80 max exposure per request.
const MAX_RECIPIENTS = 10_000;

type Recipient = {
  // customerId is present for customer-audience sends (all/repeat/inactive),
  // absent for abandoned checkouts which aren't tied to a customer row.
  customerId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
};

async function resolveAudience(
  merchantId: string,
  audience: "all" | "repeat" | "inactive" | "abandoned",
  channel: "email" | "sms"
): Promise<Recipient[]> {
  if (audience === "abandoned") {
    const rows = await db
      .select({
        name: abandonedCheckouts.customerName,
        email: abandonedCheckouts.customerEmail,
        phone: abandonedCheckouts.customerPhone,
      })
      .from(abandonedCheckouts)
      .where(
        and(
          eq(abandonedCheckouts.merchantId, merchantId),
          eq(abandonedCheckouts.status, "pending")
        )
      )
      .limit(MAX_RECIPIENTS);
    return rows
      .filter((r) => (channel === "email" ? !!r.email : !!r.phone))
      .map((r) => ({ ...r, customerId: null }));
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const conditions = [eq(customers.merchantId, merchantId)];

  if (audience === "repeat") {
    conditions.push(gt(customers.paymentCount, 1));
  } else if (audience === "inactive") {
    conditions.push(lt(customers.updatedAt, thirtyDaysAgo));
  }

  // Enforce opt-out: never message customers who have unsubscribed from
  // the channel we're sending on. This is TCPA/CAN-SPAM critical.
  if (channel === "email") {
    conditions.push(isNull(customers.emailOptOutAt));
  } else {
    conditions.push(isNull(customers.smsOptOutAt));
  }

  const rows = await db
    .select({
      customerId: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
    })
    .from(customers)
    .where(and(...conditions))
    .limit(MAX_RECIPIENTS);

  return rows.filter((r) => (channel === "email" ? !!r.email : !!r.phone));
}

function interpolate(template: string, recipient: Recipient, businessName: string | null) {
  return template
    .replaceAll("{{name}}", recipient.name ?? "there")
    .replaceAll("{{business}}", businessName ?? "us");
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Strict per-merchant send limit — 3/hour is enough to send three
  // audiences or three retries without letting a compromised session
  // blast the entire customer base repeatedly.
  const rl = getCampaignRatelimit();
  const { success } = await rl.limit(`campaign:${userId}`);
  if (!success)
    return NextResponse.json(
      {
        error:
          "Campaign send limit reached (3 per hour). Try again in a little while.",
      },
      { status: 429 }
    );

  const { id } = await params;

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.merchantId, userId)));

  if (!campaign)
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  if (campaign.status === "sent" || campaign.status === "sending") {
    return NextResponse.json(
      { error: "Campaign already sent or in progress" },
      { status: 400 }
    );
  }

  if (campaign.channel === "email" && !isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email is not configured. Add RESEND_API_KEY and EMAIL_FROM." },
      { status: 400 }
    );
  }
  if (campaign.channel === "sms" && !isTwilioConfigured()) {
    return NextResponse.json(
      {
        error:
          "SMS is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      },
      { status: 400 }
    );
  }

  const [merchant] = await db
    .select({
      businessName: merchants.businessName,
    })
    .from(merchants)
    .where(eq(merchants.id, userId));

  // Mark as "sending" before we resolve the audience so a second
  // concurrent POST hits the "already sending" guard above.
  await db
    .update(campaigns)
    .set({ status: "sending", updatedAt: new Date() })
    .where(eq(campaigns.id, id));

  const recipients = await resolveAudience(
    userId,
    campaign.audience,
    campaign.channel
  );

  if (recipients.length >= MAX_RECIPIENTS) {
    // Don't silently truncate — fail loud so the merchant understands
    // their audience was too large and can split it.
    await db
      .update(campaigns)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(campaigns.id, id));
    return NextResponse.json(
      {
        error: `Audience exceeds the ${MAX_RECIPIENTS.toLocaleString()} recipient cap per send. Split the campaign into smaller segments.`,
      },
      { status: 413 }
    );
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const body = interpolate(
      campaign.body,
      recipient,
      merchant?.businessName ?? null
    );

    // Build channel-appropriate opt-out footer. CAN-SPAM requires an
    // unsubscribe mechanism in every marketing email; TCPA/CTIA requires
    // "Reply STOP" in every marketing SMS.
    const unsubUrl = recipient.customerId
      ? buildUnsubscribeUrl({
          customerId: recipient.customerId,
          merchantId: userId,
          channel: campaign.channel,
        })
      : null;

    // Create a pending row first so webhook callbacks can land on it even
    // if the send Promise hasn't resolved yet (rare, but Resend delivers
    // webhooks incredibly fast in practice).
    const messageRowId = generateId("msg");

    if (campaign.channel === "email") {
      const footer = unsubUrl
        ? `\n\n—\nUnsubscribe from these emails: ${unsubUrl}`
        : "";
      await db.insert(campaignMessages).values({
        id: messageRowId,
        campaignId: id,
        merchantId: userId,
        customerId: recipient.customerId,
        recipient: recipient.email!,
        status: "queued",
      });

      const res = await sendEmail({
        to: recipient.email!,
        subject:
          campaign.subject ??
          "A message from " + (merchant?.businessName ?? "your vendor"),
        text: body + footer,
        fromName: merchant?.businessName ?? undefined,
        // Tag with our internal ids so webhook callbacks can be routed back
        // without needing a provider-id lookup on every event.
        tags: [
          { name: "campaign_id", value: id },
          { name: "message_row_id", value: messageRowId },
        ],
      });

      if (res.ok) {
        sent++;
        await db
          .update(campaignMessages)
          .set({
            status: "sent",
            providerMessageId: res.id,
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(campaignMessages.id, messageRowId));
      } else {
        failed++;
        await db
          .update(campaignMessages)
          .set({
            status: "failed",
            errorMessage: res.error,
            updatedAt: new Date(),
          })
          .where(eq(campaignMessages.id, messageRowId));
      }
    } else {
      const footer = " Reply STOP to opt out.";
      await db.insert(campaignMessages).values({
        id: messageRowId,
        campaignId: id,
        merchantId: userId,
        customerId: recipient.customerId,
        recipient: recipient.phone!,
        status: "queued",
      });

      const res = await sendSms({
        to: recipient.phone!,
        body: body + footer,
      });

      if (res.ok) {
        sent++;
        await db
          .update(campaignMessages)
          .set({
            status: "sent",
            providerMessageId: res.sid,
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(campaignMessages.id, messageRowId));
      } else {
        failed++;
        await db
          .update(campaignMessages)
          .set({
            status: "failed",
            errorMessage: res.error,
            updatedAt: new Date(),
          })
          .where(eq(campaignMessages.id, messageRowId));
      }
    }
  }

  const nextStatus: "sent" | "failed" =
    sent > 0 || recipients.length === 0 ? "sent" : "failed";

  await db
    .update(campaigns)
    .set({
      status: nextStatus,
      sentCount: sql`${campaigns.sentCount} + ${sent}`,
      failedCount: sql`${campaigns.failedCount} + ${failed}`,
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, id));

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "campaign_sent",
    resourceId: id,
    resourceType: "campaign",
    metadata: JSON.stringify({
      channel: campaign.channel,
      audience: campaign.audience,
      sent,
      failed,
    }),
    ipAddress: null,
  });

  return NextResponse.json({
    ok: true,
    recipients: recipients.length,
    sent,
    failed,
  });
}
