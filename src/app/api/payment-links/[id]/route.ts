import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, paymentLinks, merchants, auditLogs } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { generateId } from "@/lib/utils";
import { getRatelimit } from "@/lib/ratelimit";

const updatePaymentLinkSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

/** Fetch a single link, scoped to the authenticated merchant. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [link] = await db
    .select()
    .from(paymentLinks)
    .where(
      and(eq(paymentLinks.id, id), eq(paymentLinks.merchantId, userId))
    );

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ link });
}

/**
 * Update editable fields on a payment link:
 *  - name / description: JidoPay DB only (Stripe payment_link.update() does not
 *    support changing the displayed product name after creation)
 *  - status: "active" ↔ "inactive" mirrors to Stripe via active flag so the
 *    hosted checkout URL rejects new customers on archive
 *
 * Price/amount edits are intentionally not supported here — Stripe payment
 * links are immutable on line_items. Use the duplicate-with-new-price flow
 * at /api/payment-links/[id]/duplicate instead.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = getRatelimit();
  const { success } = await rl.limit(userId);
  if (!success)
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updatePaymentLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const [link] = await db
    .select()
    .from(paymentLinks)
    .where(
      and(eq(paymentLinks.id, id), eq(paymentLinks.merchantId, userId))
    );

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant?.stripeAccountId) {
    return NextResponse.json(
      { error: "Payout account not connected" },
      { status: 400 }
    );
  }

  if (
    parsed.data.status !== undefined &&
    parsed.data.status !== link.status &&
    link.stripePaymentLinkId
  ) {
    try {
      await stripe.paymentLinks.update(
        link.stripePaymentLinkId,
        { active: parsed.data.status === "active" },
        { stripeAccount: merchant.stripeAccountId }
      );
    } catch (err) {
      console.error("[payment-links] failed to toggle stripe active", err);
      return NextResponse.json(
        { error: "Could not update the checkout link. Try again shortly." },
        { status: 502 }
      );
    }
  }

  const [updated] = await db
    .update(paymentLinks)
    .set({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      updatedAt: new Date(),
    })
    .where(eq(paymentLinks.id, id))
    .returning();

  if (parsed.data.status === "inactive") {
    await db.insert(auditLogs).values({
      id: generateId("aud"),
      merchantId: userId,
      action: "payment_link_deactivated",
      resourceId: id,
      resourceType: "payment_link",
      metadata: JSON.stringify({ name: link.name }),
      ipAddress:
        req.headers.get("x-forwarded-for") ??
        req.headers.get("x-real-ip") ??
        null,
    });
  }

  return NextResponse.json({ link: updated });
}
