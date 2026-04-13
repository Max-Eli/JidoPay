import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { anthropic, buildSystemPrompt, type MerchantContext } from "@/lib/ai";
import { db, merchants, payments, invoices, customers } from "@/lib/db";
import { eq, sum, count } from "drizzle-orm";
import { z } from "zod";
import { getAiRatelimit } from "@/lib/ratelimit";

const messageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(4000),
    })
  ).min(1).max(50),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Strict rate limit for AI (costs money)
  const rl = getAiRatelimit();
  const { success, remaining } = await rl.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "AI rate limit reached. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 422 });
  }

  // Fetch merchant context to personalize AI responses
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  const [revenueResult] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.merchantId, userId));

  const [paymentCount] = await db
    .select({ count: count() })
    .from(payments)
    .where(eq(payments.merchantId, userId));

  const [invoiceCount] = await db
    .select({ count: count() })
    .from(invoices)
    .where(eq(invoices.merchantId, userId));

  const [customerCount] = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.merchantId, userId));

  const ctx: MerchantContext = {
    businessName: merchant?.businessName ?? null,
    totalRevenue: Number(revenueResult?.total ?? 0),
    paymentCount: paymentCount?.count ?? 0,
    invoiceCount: invoiceCount?.count ?? 0,
    customerCount: customerCount?.count ?? 0,
  };

  const systemPrompt = buildSystemPrompt(ctx);

  // Stream the response from Claude
  const stream = await anthropic.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: parsed.data.messages,
  });

  // Return a streaming response
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-RateLimit-Remaining": remaining.toString(),
    },
  });
}
