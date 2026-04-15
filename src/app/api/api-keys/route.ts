import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchantApiKeys, auditLogs } from "@/lib/db";
import { desc, eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { generateApiKey, newApiKeyId } from "@/lib/api-auth";
import { generateId } from "@/lib/utils";

// CRUD for merchant API keys (dashboard-only, Clerk-authenticated).
// Actual Bearer-token auth for the v1 public API lives in @/lib/api-auth.

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: merchantApiKeys.id,
      name: merchantApiKeys.name,
      prefix: merchantApiKeys.prefix,
      lastUsedAt: merchantApiKeys.lastUsedAt,
      createdAt: merchantApiKeys.createdAt,
    })
    .from(merchantApiKeys)
    .where(
      and(
        eq(merchantApiKeys.merchantId, userId),
        isNull(merchantApiKeys.revokedAt)
      )
    )
    .orderBy(desc(merchantApiKeys.createdAt));

  return NextResponse.json({ keys: rows });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { plaintext, prefix, hash } = generateApiKey();

  const [key] = await db
    .insert(merchantApiKeys)
    .values({
      id: newApiKeyId(),
      merchantId: userId,
      name: parsed.data.name,
      prefix,
      hashedKey: hash,
    })
    .returning({
      id: merchantApiKeys.id,
      name: merchantApiKeys.name,
      prefix: merchantApiKeys.prefix,
      createdAt: merchantApiKeys.createdAt,
    });

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "settings_updated",
    resourceId: key.id,
    resourceType: "api_key",
    metadata: JSON.stringify({ name: parsed.data.name, action: "api_key_created" }),
    ipAddress: req.headers.get("x-forwarded-for") ?? null,
  });

  // Plaintext is returned exactly once. The merchant must copy it now —
  // we can't show it again because only the hash is stored.
  return NextResponse.json(
    { key: { ...key, plaintext } },
    { status: 201 }
  );
}
