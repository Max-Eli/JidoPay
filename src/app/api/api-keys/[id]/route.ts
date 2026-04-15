import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, merchantApiKeys, auditLogs } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

// Revoking is a soft delete — we set revokedAt so the audit trail survives
// and any in-flight requests using the old key fail auth on the next lookup.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [row] = await db
    .update(merchantApiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(merchantApiKeys.id, id),
        eq(merchantApiKeys.merchantId, userId)
      )
    )
    .returning({ id: merchantApiKeys.id });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "settings_updated",
    resourceId: id,
    resourceType: "api_key",
    metadata: JSON.stringify({ action: "api_key_revoked" }),
    ipAddress: req.headers.get("x-forwarded-for") ?? null,
  });

  return NextResponse.json({ ok: true });
}
