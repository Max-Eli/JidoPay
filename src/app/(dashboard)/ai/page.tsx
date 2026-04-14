import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { AiChat } from "@/components/dashboard/ai-chat";

export const metadata = { title: "AI assistant" };

export default async function AiPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <>
      <Topbar
        title="AI assistant"
        description="Ask anything about your payments, customers, and growth."
      />
      <div className="mx-auto flex h-[calc(100vh-160px)] max-w-4xl flex-col px-4 py-6 md:px-8 md:py-10">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
          <AiChat />
        </div>
      </div>
    </>
  );
}
