import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchants, auditLogs } from "@/lib/db";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { stripe } from "@/lib/stripe";
import { validateStorefrontSlug } from "@/lib/branded-url";

const updateMerchantSchema = z.object({
  businessName: z.string().max(255).optional(),
  oneClickPayEnabled: z.boolean().optional(),
  walletEnabled: z.boolean().optional(),
  abandonedRecoveryEnabled: z.boolean().optional(),
  storefrontSlug: z.string().max(64).nullable().optional(),
  storefrontTagline: z.string().max(160).nullable().optional(),
  storefrontEnabled: z.boolean().optional(),
});

/** Called on first visit after sign-up to provision the merchant record */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const email = user.emailAddresses[0]?.emailAddress ?? "";

  // Upsert — safe to call multiple times
  const [existing] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (existing) {
    return NextResponse.json({ merchant: existing });
  }

  const [merchant] = await db
    .insert(merchants)
    .values({
      id: userId,
      email,
    })
    .returning();

  return NextResponse.json({ merchant });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ merchant });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateMerchantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  // Read the current row first so we can capture a before/after diff
  // in the audit log. Settings changes are sensitive (they flip feature
  // flags that affect customer data handling) and we need a trail.
  const [before] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!before) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Normalize + validate the storefront slug before touching the DB.
  // Merchants can clear their slug by passing null or empty string; any
  // non-empty value has to pass the slug rules and must not collide with
  // another merchant.
  const updates: Partial<typeof merchants.$inferInsert> = { ...parsed.data };
  if (parsed.data.storefrontSlug !== undefined) {
    const raw = parsed.data.storefrontSlug;
    if (raw === null || raw.trim() === "") {
      updates.storefrontSlug = null;
    } else {
      const check = validateStorefrontSlug(raw);
      if (!check.ok) {
        return NextResponse.json({ error: check.reason }, { status: 422 });
      }
      const [clash] = await db
        .select({ id: merchants.id })
        .from(merchants)
        .where(
          and(
            eq(merchants.storefrontSlug, check.value),
            ne(merchants.id, userId)
          )
        );
      if (clash) {
        return NextResponse.json(
          { error: "That handle is already taken." },
          { status: 409 }
        );
      }
      updates.storefrontSlug = check.value;
    }
  }
  if (parsed.data.storefrontTagline !== undefined) {
    const raw = parsed.data.storefrontTagline;
    updates.storefrontTagline =
      raw === null || raw.trim() === "" ? null : raw.trim();
  }

  const [merchant] = await db
    .update(merchants)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(merchants.id, userId))
    .returning();

  // Mirror the merchant's display name to their Stripe Connect account so
  // it shows on hosted checkout (otherwise Stripe falls back to the legal
  // individual name, which looks unprofessional for solo operators with a
  // registered DBA).
  if (
    parsed.data.businessName !== undefined &&
    parsed.data.businessName !== before.businessName &&
    before.stripeAccountId
  ) {
    try {
      await stripe.accounts.update(before.stripeAccountId, {
        business_profile: { name: parsed.data.businessName },
      });
    } catch (err) {
      console.error(
        `[merchants] failed to sync businessName to Stripe for ${userId}`,
        err
      );
    }
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(parsed.data) as Array<keyof typeof parsed.data>) {
    const next = parsed.data[key];
    if (next === undefined) continue;
    const prev = before[key as keyof typeof before];
    if (prev !== next) {
      changes[key] = { from: prev, to: next };
    }
  }

  if (Object.keys(changes).length > 0) {
    await db.insert(auditLogs).values({
      id: generateId("aud"),
      merchantId: userId,
      action: "settings_updated",
      resourceId: userId,
      resourceType: "merchant_settings",
      metadata: JSON.stringify({ changes }),
      ipAddress:
        req.headers.get("x-forwarded-for") ??
        req.headers.get("x-real-ip") ??
        null,
    });
  }

  return NextResponse.json({ merchant });
}
