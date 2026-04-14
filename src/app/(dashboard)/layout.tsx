import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, merchants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AiWidget } from "@/components/dashboard/ai-widget";
import { Toaster } from "@/components/ui/toaster";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [existing] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, userId));

  if (!existing) {
    const user = await currentUser();
    if (user) {
      await db
        .insert(merchants)
        .values({
          id: userId,
          email: user.emailAddresses[0]?.emailAddress ?? "",
        })
        .onConflictDoNothing();
    }
  }

  return (
    <div
      data-app-ui
      className="min-h-screen bg-background text-foreground"
    >
      <Sidebar />
      <main className="pl-64">{children}</main>
      <AiWidget />
      <Toaster />
    </div>
  );
}
