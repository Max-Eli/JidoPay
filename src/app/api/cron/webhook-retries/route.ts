import { NextRequest, NextResponse } from "next/server";
import { sweepPendingDeliveries } from "@/lib/merchant-webhooks";

// Runs every minute from vercel.json. Picks up any pending or retrying
// webhook deliveries whose backoff window has elapsed and retries them.
// Vercel stamps the request with an `Authorization: Bearer <CRON_SECRET>`
// header when CRON_SECRET is set in the project env, so we verify that
// before doing anything. Without the secret anyone could trigger sweeps.

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const processed = await sweepPendingDeliveries(100);
    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    console.error("[cron] webhook-retries failed", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
