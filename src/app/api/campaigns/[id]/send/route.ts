import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  db,
  campaigns,
  customers,
  merchants,
  auditLogs,
  abandonedCheckouts,
} from "@/lib/db";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { sendSms, isTwilioConfigured } from "@/lib/twilio";
import { generateId } from "@/lib/utils";
import { getAiRatelimit } from "@/lib/ratelimit";

type Recipient = {
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
      );
    return rows.filter((r) =>
      channel === "email" ? !!r.email : !!r.phone
    );
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const conditions = [eq(customers.merchantId, merchantId)];

  if (audience === "repeat") {
    conditions.push(gt(customers.paymentCount, 1));
  } else if (audience === "inactive") {
    conditions.push(lt(customers.updatedAt, thirtyDaysAgo));
  }

  const rows = await db
    .select({
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
    })
    .from(customers)
    .where(and(...conditions));

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

  const rl = getAiRatelimit();
  const { success } = await rl.limit(`campaign:${userId}`);
  if (!success)
    return NextResponse.json(
      { error: "Too many send requests. Try again shortly." },
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
    .select({ businessName: merchants.businessName })
    .from(merchants)
    .where(eq(merchants.id, userId));

  await db
    .update(campaigns)
    .set({ status: "sending", updatedAt: new Date() })
    .where(eq(campaigns.id, id));

  const recipients = await resolveAudience(
    userId,
    campaign.audience,
    campaign.channel
  );

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const body = interpolate(
      campaign.body,
      recipient,
      merchant?.businessName ?? null
    );
    if (campaign.channel === "email") {
      const res = await sendEmail({
        to: recipient.email!,
        subject: campaign.subject ?? "A message from " + (merchant?.businessName ?? "your vendor"),
        text: body,
      });
      res.ok ? sent++ : failed++;
    } else {
      const res = await sendSms({ to: recipient.phone!, body });
      res.ok ? sent++ : failed++;
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
