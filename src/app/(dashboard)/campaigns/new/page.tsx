import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { NewCampaignForm } from "@/components/dashboard/new-campaign-form";

export const metadata = { title: "New campaign" };

export default async function NewCampaignPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <>
      <Topbar
        title="New campaign"
        description="Reach your customers with targeted email or SMS."
      />
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
        <NewCampaignForm />
      </div>
    </>
  );
}
