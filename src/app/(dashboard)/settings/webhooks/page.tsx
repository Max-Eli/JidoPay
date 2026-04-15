import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/dashboard/topbar";
import { WebhooksManager } from "@/components/dashboard/webhooks-manager";

export const metadata = { title: "Webhooks" };

export default async function WebhooksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <>
      <Topbar
        title="Webhooks"
        description="Deliver signed events to your own servers so you can react to payments in real time."
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to settings
        </Link>
        <WebhooksManager />
      </div>
    </>
  );
}
