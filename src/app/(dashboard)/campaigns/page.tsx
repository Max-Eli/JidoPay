import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, campaigns } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { Megaphone, Mail, MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { StatusPill } from "@/components/dashboard/status-pill";
import { CreateCampaignButton } from "@/components/dashboard/create-campaign-button";
import { SendCampaignButton } from "@/components/dashboard/send-campaign-button";

export const metadata = { title: "Campaigns" };

const AUDIENCE_LABEL: Record<string, string> = {
  all: "All customers",
  repeat: "Repeat buyers",
  inactive: "Inactive",
  abandoned: "Abandoned checkouts",
};

export default async function CampaignsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const list = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.merchantId, userId))
    .orderBy(desc(campaigns.createdAt));

  return (
    <>
      <Topbar
        title="Retargeting"
        description="Win customers back with targeted SMS and email campaigns."
        actions={<CreateCampaignButton />}
      />

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Campaigns
              </p>
              <h2 className="mt-1 font-display text-lg">
                All campaigns
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {list.length}
                </span>
              </h2>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                <Megaphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-display text-lg">No campaigns yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Reach inactive customers, repeat buyers, or abandoned checkouts
                with a single send.
              </p>
              <div className="mt-6">
                <CreateCampaignButton />
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {list.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      {c.channel === "email" ? (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      )}
                      <p className="truncate font-display text-lg">{c.name}</p>
                      <StatusPill status={c.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      <span>Audience · {AUDIENCE_LABEL[c.audience] ?? c.audience}</span>
                      <span>{c.sentCount} sent</span>
                      {c.failedCount > 0 && (
                        <span className="text-red-500">
                          {c.failedCount} failed
                        </span>
                      )}
                      <span>
                        {c.sentAt
                          ? `Sent ${formatDate(c.sentAt)}`
                          : `Created ${formatDate(c.createdAt)}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.status === "draft" && (
                      <SendCampaignButton
                        campaignId={c.id}
                        campaignName={c.name}
                      />
                    )}
                    {(c.status === "sent" || c.status === "sending") && (
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/60 hover:bg-muted"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        View stats
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
