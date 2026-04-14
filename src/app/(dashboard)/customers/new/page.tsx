import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { NewCustomerForm } from "@/components/dashboard/new-customer-form";

export const metadata = { title: "New customer" };

export default async function NewCustomerPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <>
      <Topbar
        title="New customer"
        description="Add a customer manually so you can bill or message them."
      />
      <div className="mx-auto max-w-2xl px-8 py-10">
        <NewCustomerForm />
      </div>
    </>
  );
}
