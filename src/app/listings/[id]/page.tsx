import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OfferForm from "./offer-form";
import { NICHE_DEFS, type NicheSlug } from "@/niches/def";

export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [listing, session] = await Promise.all([
    db.buyerListing.findUnique({
      where: { id },
      include: { buyer: true, niche: true },
    }),
    getServerSession(authOptions),
  ]);

  if (!listing) return <main className="p-6">Listing not found</main>;

  const isOwner = session?.user?.email === listing.buyer.email;

  const nicheSlug = listing.niche?.slug as NicheSlug | undefined;
  const def = nicheSlug ? NICHE_DEFS[nicheSlug] : undefined;
  const nicheName = listing.niche?.name ?? "Uncategorized";
  const attrs = (listing.attributes ?? {}) as Record<string, unknown>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-200">
          {nicheName}
        </span>
      </div>

      <div className="text-sm text-gray-600 mt-1">
        Posted by{" "}
        <Link href={`mailto:${listing.buyer.email}`} className="underline">
          @{listing.buyer.username ?? listing.buyer.email}
        </Link>{" "}
        • {new Date(listing.createdAt).toLocaleString()}
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

      {/* Only render labeled attributes if we have a niche definition */}
      {def && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Details — {def.name}</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {def.fields.map((f) => {
              const v = attrs[f.key];
              if (v === undefined || v === null || v === "") return null;
              return (
                <div key={f.key} className="border p-2 rounded">
                  <dt className="text-xs uppercase text-gray-500">{f.label}</dt>
                  <dd className="text-sm mt-1">{String(v)}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      {!isOwner ? (
        <OfferForm listingId={listing.id} />
      ) : (
        <div className="mt-6 text-sm text-gray-600">You posted this request.</div>
      )}
    </main>
  );
}
