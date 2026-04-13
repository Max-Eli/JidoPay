import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, marketingLeads } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { getPublicRatelimit } from "@/lib/ratelimit";
import { sendSms, isTwilioConfigured } from "@/lib/twilio";

export const runtime = "nodejs";

// The exact opt-in language shown to the user. Stored verbatim on every
// lead row so we can prove consent for TCR/TCPA audit purposes.
export const SMS_CONSENT_TEXT =
  "By checking this box and submitting, you agree to receive recurring marketing text messages from JidoPay at the number provided, including messages sent by autodialer. Consent is not a condition of any purchase. Message frequency varies (up to 6 msgs/month). Msg & data rates may apply. Reply STOP to cancel, HELP for help. See our Privacy Policy and Terms of Service.";

const bodySchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(10).max(24),
  consent: z.literal(true),
  source: z.string().max(64).optional(),
});

/** Normalize user-entered phone to E.164. US-only fallback. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) {
    return digits.length >= 10 ? `+${digits}` : null;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  try {
    const rl = getPublicRatelimit();
    const { success } = await rl.limit(`marketing-leads:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }
  } catch {
    // If Redis is unavailable, fall through — do not block signups.
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your details and try again." },
      { status: 422 }
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Please enter a valid US phone number." },
      { status: 422 }
    );
  }

  const existing = await db
    .select()
    .from(marketingLeads)
    .where(eq(marketingLeads.phone, phone));

  if (existing.length > 0) {
    // Idempotent success — don't reveal whether the number was already on
    // the list, but also don't re-send the welcome SMS.
    return NextResponse.json({ ok: true, alreadySubscribed: true });
  }

  const id = generateId("lead");
  await db.insert(marketingLeads).values({
    id,
    firstName: parsed.data.firstName,
    phone,
    source: parsed.data.source ?? "popup",
    consentText: SMS_CONSENT_TEXT,
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  // Send welcome SMS — TCR requires a confirmation message that restates
  // who we are, what to expect, and how to opt out.
  if (isTwilioConfigured()) {
    const welcome = `JidoPay: Thanks ${parsed.data.firstName}! You're in. Expect up to 6 msgs/mo with product updates & offers. Msg&data rates may apply. Reply STOP to cancel, HELP for help.`;
    const result = await sendSms({ to: phone, body: welcome });
    if (result.ok) {
      await db
        .update(marketingLeads)
        .set({ welcomeSmsSent: true })
        .where(eq(marketingLeads.id, id));
    }
  }

  return NextResponse.json({ ok: true });
}
