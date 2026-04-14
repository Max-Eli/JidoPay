import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, customers, auditLogs } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { getRatelimit } from "@/lib/ratelimit";

const createCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = getRatelimit();
  const { success } = await rl.limit(userId);
  if (!success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Reject duplicates under the same merchant (case-insensitive compare
  // would be nicer, but we store emails as entered; normalize on write).
  const normalizedEmail = data.email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.merchantId, userId),
        eq(customers.email, normalizedEmail)
      )
    );
  if (existing) {
    return NextResponse.json(
      { error: "A customer with this email already exists" },
      { status: 409 }
    );
  }

  const customerId = generateId("cus");
  const [customer] = await db
    .insert(customers)
    .values({
      id: customerId,
      merchantId: userId,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
    })
    .returning();

  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "customer_created",
    resourceId: customerId,
    resourceType: "customer",
    metadata: JSON.stringify({ name: customer.name, email: customer.email }),
    ipAddress: req.headers.get("x-forwarded-for") ?? null,
  });

  return NextResponse.json({ customer }, { status: 201 });
}
