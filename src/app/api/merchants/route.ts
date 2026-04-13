import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateMerchantSchema = z.object({
  businessName: z.string().max(255).optional(),
  oneClickPayEnabled: z.boolean().optional(),
  walletEnabled: z.boolean().optional(),
  abandonedRecoveryEnabled: z.boolean().optional(),
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

  const [merchant] = await db
    .update(merchants)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(merchants.id, userId))
    .returning();

  return NextResponse.json({ merchant });
}
