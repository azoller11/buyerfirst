import { db } from "@/lib/db";
import EditListingForm from "./EditListingForm";
import { type NicheSlug } from "@/niches/def";

export default async function EditPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await db.buyerListing.findUnique({
    where: { id },
    include: { niche: true },
  });
  if (!listing) return <main className="p-6">Listing not found</main>;

  return (
    <EditListingForm
      listing={{
        id: listing.id,
        title: listing.title,
        description: listing.description,
        location: listing.location,
        budgetMin: listing.budgetMin,
        budgetMax: listing.budgetMax,
        photos: listing.photos ?? [],
        nicheSlug: (listing.niche?.slug as NicheSlug | undefined) ?? "",
        attributes: (listing.attributes ?? {}) as Record<string, unknown>,
      }}
    />
  );
}
