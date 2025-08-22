import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { NICHE_DEFS, type NicheSlug } from "../../../../niches/def";
import NewNicheListingForm from "../new/form";

export default async function NewNicheListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/");

  const { slug } = await params;
  const def = NICHE_DEFS[slug as NicheSlug];
  if (!def) return <main className="p-6">Unknown niche.</main>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Post a Buyer Listing — {def.name}</h1>
      <NewNicheListingForm slug={def.slug} />
    </main>
  );
}
