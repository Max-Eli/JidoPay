import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, invoices, invoiceItems, merchants, auditLogs } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import { generateId, generateInvoiceNumber, calculateApplicationFee } from "@/lib/utils";
import { stripe } from "@/lib/stripe";
import { getRatelimit } from "@/lib/ratelimit";

const createInvoiceSchema = z.object({
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
  customerId: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        quantity: z.number().int().min(1).max(1000),
        unitAmount: z.number().int().min(1), // cents
      })
    )
    .min(1)
    .max(50),
  taxAmount: z.number().int().min(0).default(0), // cents
  dueDate: z.string().optional(), // ISO date string
  notes: z.string().max(1000).optional(),
  currency: z.string().length(3).default("usd"),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit
  const rl = getRatelimit();
  const { success } = await rl.limit(userId);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!merchant?.stripeAccountId) {
    return NextResponse.json(
      { error: "Stripe account not connected" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Calculate amounts
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmount,
    0
  );
  const totalAmount = subtotal + data.taxAmount;

  // Generate invoice number
  const [countResult] = await db
    .select({ count: count() })
    .from(invoices)
    .where(eq(invoices.merchantId, userId));
  const invoiceNumber = generateInvoiceNumber(countResult?.count ?? 0);

  const invoiceId = generateId("inv");

  // Create Stripe Payment Intent on the connected account.
  // Idempotency key is derived from (merchantId, invoiceId) so a retried
  // POST of the same logical invoice never creates a duplicate charge.
  const appFee = calculateApplicationFee(totalAmount);
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: totalAmount,
      currency: data.currency,
      application_fee_amount: appFee,
      metadata: {
        merchantId: userId,
        invoiceId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
      },
      receipt_email: data.customerEmail,
      description: `Invoice ${invoiceNumber} from ${merchant.businessName ?? "merchant"}`,
    },
    {
      stripeAccount: merchant.stripeAccountId,
      idempotencyKey: `invoice_${userId}_${invoiceId}`,
    }
  );

  // Insert invoice + items
  const [invoice] = await db
    .insert(invoices)
    .values({
      id: invoiceId,
      merchantId: userId,
      customerId: data.customerId ?? null,
      invoiceNumber,
      status: "draft",
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      subtotal,
      taxAmount: data.taxAmount,
      totalAmount,
      currency: data.currency,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes ?? null,
      stripePaymentIntentId: paymentIntent.id,
    })
    .returning();

  await db.insert(invoiceItems).values(
    data.items.map((item) => ({
      id: generateId("item"),
      invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      totalAmount: item.quantity * item.unitAmount,
    }))
  );

  // Audit log
  await db.insert(auditLogs).values({
    id: generateId("aud"),
    merchantId: userId,
    action: "invoice_created",
    resourceId: invoiceId,
    resourceType: "invoice",
    metadata: JSON.stringify({ invoiceNumber, totalAmount }),
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
