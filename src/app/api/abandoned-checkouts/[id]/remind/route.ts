import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  db,
  abandonedCheckouts,
  merchants,
  paymentLinks,
  auditLogs,
} from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { sendSms, isTwilioConfigured } from "@/lib/twilio";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { formatCurrency, generateId } from "@/lib/utils";
import { getAiRatelimit } from "@/lib/ratelimit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = getAiRatelimit();
  const { success } = await rl.limit(`abn:${userId}`);
  if (!success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;

  const [row] = await db
    .select()
    .from(abandonedCheckouts)
    .where(
      and(
        eq(abandonedCheckouts.id, id),
        eq(abandonedCheckouts.merchantId, userId)
      )
    );

  if (!row)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (row.status !== "pending") {
    return NextResponse.json(
      { error: `Checkout is already ${row.status}` },
      { status: 400 }
    );
  }

  const [merchant] = await db
    .select({ businessName: merchants.businessName })
    .from(merchants)
    .where(eq(merchants.id, userId));

  let linkUrl: string | null = null;
  if (row.paymentLinkId) {
    const [link] = await db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.id, row.paymentLinkId));
    linkUrl = link?.stripePaymentLinkUrl ?? null;
  }

  const business = merchant?.businessName ?? "us";
  const name = row.customerName ?? "there";
  const amountStr = formatCurrency(row.amount, row.currency);
  const message = linkUrl
    ? `Hi ${name}, you left a ${amountStr} checkout at ${business}. Finish here: ${linkUrl}`
    : `Hi ${name}, you left a ${amountStr} checkout at ${business}. Come back anytime to finish!`;

  // Prefer SMS if phone present, but if SMS fails (or isn't configured)
  // fall back to email automatically. We only give up if *both* channels
  // have been tried (or are unavailable).
  const canSms = !!row.customerPhone && isTwilioConfigured();
  const canEmail = !!row.customerEmail && isEmailConfigured();

  if (!canSms && !canEmail) {
    return NextResponse.json(
      {
        error:
          "No reachable channel. Configure Twilio for SMS or Resend for email, and ensure the customer has a phone or email.",
      },
      { status: 400 }
    );
  }

  const attempts: Array<{ channel: "sms" | "email"; error: string }> = [];
  let delivered = false;
  let channel: "sms" | "email" | null = null;

  if (canSms) {
    const res = await sendSms({ to: row.customerPhone!, body: message });
    if (res.ok) {
      delivered = true;
      channel = "sms";
    } else {
      attempts.push({ channel: "sms", error: res.error });
    }
  }

  if (!delivered && canEmail) {
    const res = await sendEmail({
      to: row.customerEmail!,
      subject: `You left ${amountStr} behind`,
      text: message,
    });
    if (res.ok) {
      delivered = true;
      channel = "email";
    } else {
      attempts.push({ channel: "email", error: res.error });
    }
  }

  if (!delivered) {
    // Surface the specific channel failures so the merchant can debug
    // rather than showing a generic "failed" message in the UI.
    return NextResponse.json(
      {
        error:
          attempts.length > 0
            ? `Failed to send reminder: ${attempts
                .map((a) => `${a.channel} (${a.error})`)
                .join("; ")}`
            : "Failed to send reminder",
      },
      { status: 502 }
    );
  }

  await db
    .update(abandonedCheckouts)
    .set({ status: "reminded", remindedAt: new Date() })
    .where(eq(abandonedCheckouts.id, id));

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "abandoned_checkout_reminded",
    resourceId: id,
    resourceType: "abandoned_checkout",
    metadata: JSON.stringify({ channel, amount: row.amount }),
    ipAddress: null,
  });

  return NextResponse.json({ ok: true, channel });
}
