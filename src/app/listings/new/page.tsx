// app/listings/new/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NewListingForm from "./NewListingForm";

export default async function NewListingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin?callbackUrl=/listings/new");
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Post a Buyer Listing (WTB)</h1>
      <NewListingForm />
    </main>
  );
}
