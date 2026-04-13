import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { CheckCircle2, XCircle } from "lucide-react";
import { db, customers, auditLogs } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { generateId } from "@/lib/utils";

export const metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const parsed = verifyUnsubscribeToken(token);

  if (!parsed) {
    return <Shell ok={false} message="This unsubscribe link is invalid or expired." />;
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, parsed.customerId),
        eq(customers.merchantId, parsed.merchantId)
      )
    );

  if (!customer) {
    return <Shell ok={false} message="We couldn't find that contact record." />;
  }

  const field = parsed.channel === "email" ? "emailOptOutAt" : "smsOptOutAt";
  if (!customer[field]) {
    await db
      .update(customers)
      .set({ [field]: new Date(), updatedAt: new Date() })
      .where(eq(customers.id, parsed.customerId));

    await db.insert(auditLogs).values({
      id: generateId("aud"),
      merchantId: parsed.merchantId,
      action: "customer_unsubscribed",
      resourceId: parsed.customerId,
      resourceType: "customer",
      metadata: JSON.stringify({ channel: parsed.channel }),
      ipAddress: null,
    });
  }

  return (
    <Shell
      ok
      message={
        parsed.channel === "email"
          ? "You've been unsubscribed from marketing emails. You may still receive important account notifications."
          : "You've been unsubscribed from marketing SMS. You may still receive one-off transactional messages."
      }
    />
  );
}

function Shell({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card p-10 text-center shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-60 w-60 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative">
          <div
            className={
              "mx-auto flex h-12 w-12 items-center justify-center rounded-xl " +
              (ok ? "bg-accent/10" : "bg-destructive/10")
            }
          >
            {ok ? (
              <CheckCircle2 className="h-5 w-5 text-accent" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
          <h1 className="mt-6 font-display text-2xl">
            {ok ? "All set" : "Link error"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Back to JidoPay
          </Link>
        </div>
      </div>
    </div>
  );
}
