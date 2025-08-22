import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OfferForm from "./offer-form";

export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>; // 👈 params is a Promise now
}) {
  const { id } = await params;      // 👈 await it

  const [listing, session] = await Promise.all([
    db.buyerListing.findUnique({ where: { id }, include: { buyer: true } }),
    getServerSession(authOptions),
  ]);

  if (!listing) return <main className="p-6">Listing not found</main>;

  const isOwner = session?.user?.email === listing.buyer.email;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{listing.title}</h1>
      <div className="text-sm text-gray-600 mt-1">
        Posted by <span className="underline">@{listing.buyer.username ?? listing.buyer.email}</span>
        {" "}• {new Date(listing.createdAt).toLocaleString()}
      </div>

      {(listing.budgetMin || listing.budgetMax) && (
        <div className="mt-2">
          Budget: ${listing.budgetMin ?? "?"} – ${listing.budgetMax ?? "?"}
        </div>
      )}
      {listing.location && <div className="mt-1">Location: {listing.location}</div>}

      <p className="mt-4 whitespace-pre-wrap">{listing.description}</p>

      {listing.photos?.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {listing.photos.map((src, i) => (
            <div key={i} className="relative aspect-video bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`photo-${i}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      {!isOwner ? (
        <OfferForm listingId={listing.id} />
      ) : (
        <div className="mt-6 text-sm text-gray-600">You posted this request.</div>
      )}
    </main>
  );
}
