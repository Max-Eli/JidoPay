import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, merchants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

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

  return <DashboardShell>{children}</DashboardShell>;
}
