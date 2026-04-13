import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, campaigns } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { getRatelimit } from "@/lib/ratelimit";

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  channel: z.enum(["email", "sms"]),
  audience: z.enum(["all", "repeat", "inactive", "abandoned"]).default("all"),
  subject: z.string().max(255).optional(),
  body: z.string().min(1).max(4000),
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

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;
  if (data.channel === "email" && !data.subject) {
    return NextResponse.json(
      { error: "Subject is required for email campaigns" },
      { status: 422 }
    );
  }

  const [campaign] = await db
    .insert(campaigns)
    .values({
      id: generateId("cmp"),
      merchantId: userId,
      name: data.name,
      channel: data.channel,
      audience: data.audience,
      subject: data.subject ?? null,
      body: data.body,
      status: "draft",
    })
    .returning();

  return NextResponse.json({ campaign }, { status: 201 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.merchantId, userId))
    .orderBy(desc(campaigns.createdAt));

  return NextResponse.json({ campaigns: list });
}
