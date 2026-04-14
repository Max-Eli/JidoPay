import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Check,
  Eye,
  MousePointerClick,
  AlertTriangle,
  ShieldAlert,
  Send,
  XCircle,
} from "lucide-react";
import { db, campaigns, campaignMessages } from "@/lib/db";
import { and, eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { Topbar } from "@/components/dashboard/topbar";
import { StatusPill } from "@/components/dashboard/status-pill";

export const metadata = { title: "Campaign" };

const STATUS_DOT: Record<string, string> = {
  queued: "bg-muted-foreground/40",
  sent: "bg-sky-500",
  delivered: "bg-emerald-500",
  opened: "bg-accent",
  clicked: "bg-violet-500",
  bounced: "bg-amber-500",
  complained: "bg-rose-500",
  failed: "bg-destructive",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.merchantId, userId)));

  if (!campaign) notFound();

  const messages = await db
    .select()
    .from(campaignMessages)
    .where(eq(campaignMessages.campaignId, id))
    .orderBy(desc(campaignMessages.updatedAt))
    .limit(100);

  const totalSent = campaign.sentCount;
  const delivered = campaign.deliveredCount;
  const opened = campaign.openedCount;
  const clicked = campaign.clickedCount;
  const bounced = campaign.bouncedCount;
  const complained = campaign.complainedCount;

  const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
  const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
  const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
  const clickThroughOpens = opened > 0 ? (clicked / opened) * 100 : 0;
  const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;

  const isEmail = campaign.channel === "email";

  return (
    <>
      <Topbar
        title={campaign.name}
        description={`${isEmail ? "Email" : "SMS"} campaign · ${campaign.audience} audience`}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to campaigns
        </Link>

        {/* Header card */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {isEmail ? (
                  <Mail className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                )}
                <h2 className="font-display text-lg">{campaign.name}</h2>
                <StatusPill status={campaign.status} />
              </div>
              {campaign.subject && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Subject
                  </span>{" "}
                  {campaign.subject}
                </p>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
                {campaign.body}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {campaign.sentAt ? "Sent" : "Created"}
              </p>
              <p className="mt-1 font-mono text-xs text-foreground">
                {formatDate(campaign.sentAt ?? campaign.createdAt)}
              </p>
            </div>
          </div>
        </section>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={<Send className="h-4 w-4" />}
            label="Sent"
            value={totalSent.toLocaleString()}
            hint={
              campaign.failedCount > 0
                ? `${campaign.failedCount} send failures`
                : "All requests accepted"
            }
          />
          <StatCard
            icon={<Check className="h-4 w-4" />}
            label="Delivered"
            value={delivered.toLocaleString()}
            hint={`${deliveryRate.toFixed(1)}% delivery rate`}
            accent="emerald"
          />
          <StatCard
            icon={<Eye className="h-4 w-4" />}
            label="Opened"
            value={opened.toLocaleString()}
            hint={`${openRate.toFixed(1)}% open rate`}
            accent="accent"
            disabled={!isEmail}
            disabledHint="Email only"
          />
          <StatCard
            icon={<MousePointerClick className="h-4 w-4" />}
            label="Clicked"
            value={clicked.toLocaleString()}
            hint={
              opened > 0
                ? `${clickRate.toFixed(1)}% CTR · ${clickThroughOpens.toFixed(
                    0
                  )}% of opens`
                : `${clickRate.toFixed(1)}% CTR`
            }
            accent="violet"
            disabled={!isEmail}
            disabledHint="Email only"
          />
        </div>

        {/* Problems row */}
        {(bounced > 0 || complained > 0 || campaign.failedCount > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {campaign.failedCount > 0 && (
              <SmallStat
                icon={<XCircle className="h-4 w-4" />}
                label="Failed to queue"
                value={campaign.failedCount.toLocaleString()}
                tone="destructive"
              />
            )}
            {bounced > 0 && (
              <SmallStat
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Bounced"
                value={bounced.toLocaleString()}
                tone="amber"
                hint={`${bounceRate.toFixed(1)}% bounce rate`}
              />
            )}
            {complained > 0 && (
              <SmallStat
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Spam reports"
                value={complained.toLocaleString()}
                tone="rose"
              />
            )}
          </div>
        )}

        {/* Per-recipient table */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Recipients
              </p>
              <h2 className="mt-1 font-display text-lg">
                Latest activity
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {messages.length}
                </span>
              </h2>
            </div>
            {isEmail && (
              <p className="text-xs text-muted-foreground">
                Updates live as recipients open and click.
              </p>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No delivery data yet. It can take a minute or two after
                sending for events to arrive.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left">
                    <Th>Recipient</Th>
                    <Th>Status</Th>
                    <Th>Opens</Th>
                    <Th>Clicks</Th>
                    <Th>Last update</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {messages.map((m) => (
                    <tr
                      key={m.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <Td className="truncate font-medium">{m.recipient}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[m.status] ?? "bg-muted-foreground/40"}`}
                          />
                          <span className="capitalize">{m.status}</span>
                        </span>
                        {m.errorMessage && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {m.errorMessage}
                          </p>
                        )}
                      </Td>
                      <Td className="font-mono text-xs text-muted-foreground">
                        {m.openCount}
                      </Td>
                      <Td className="font-mono text-xs text-muted-foreground">
                        {m.clickCount}
                      </Td>
                      <Td className="font-mono text-xs text-muted-foreground">
                        {formatDate(m.updatedAt)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
  disabled,
  disabledHint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: "emerald" | "accent" | "violet";
  disabled?: boolean;
  disabledHint?: string;
}) {
  const accentClasses =
    accent === "emerald"
      ? "text-emerald-500"
      : accent === "violet"
        ? "text-violet-500"
        : accent === "accent"
          ? "text-accent"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border/60 bg-card px-5 py-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className={`${disabled ? "text-muted-foreground/40" : accentClasses}`}>
          {icon}
        </span>
      </div>
      <p
        className={`mt-3 font-display text-3xl tracking-tight ${disabled ? "text-muted-foreground/40" : "text-foreground"}`}
      >
        {disabled ? "—" : value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {disabled ? disabledHint : hint}
      </p>
    </div>
  );
}

function SmallStat({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "destructive" | "amber" | "rose";
  hint?: string;
}) {
  const toneClass =
    tone === "destructive"
      ? "border-destructive/30 text-destructive"
      : tone === "amber"
        ? "border-amber-500/30 text-amber-500"
        : "border-rose-500/30 text-rose-500";
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border bg-card px-5 py-4 ${toneClass}`}
    >
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-display text-lg text-foreground">{value}</p>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>;
}
