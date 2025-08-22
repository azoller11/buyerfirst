import Link from "next/link";
import { db } from "@/lib/db";
import { NICHE_DEFS, type NicheSlug } from "../../../niches/def";

export const dynamic = "force-dynamic";

export default async function NicheBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const def = NICHE_DEFS[slug as NicheSlug];
  if (!def) return <main className="p-6">Unknown niche.</main>;

  const { q = "" } = await searchParams;
  const listings = await db.buyerListing.findMany({
    where: {
      niche: { slug },
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { buyer: true, niche: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{def.name} — Buyer Listings</h1>
        <Link href={`/n/${slug}/new`} className="underline">Post WTB</Link>
      </div>

      <form className="mt-4">
        <input
          name="q"
          defaultValue={q}
          placeholder={`Search ${def.name}…`}
          className="border p-2 w-full"
        />
      </form>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {listings.map((l) => (
          <li key={l.id} className="border p-3">
            <Link href={`/listings/${l.id}`} className="font-medium underline">
              {l.title}
            </Link>
            <div className="text-sm text-gray-600 mt-1">
              by @{l.buyer.username ?? l.buyer.email} • {new Date(l.createdAt).toLocaleDateString()}
            </div>
            {(l.budgetMin || l.budgetMax) && (
              <div className="text-sm mt-1">Budget: ${l.budgetMin ?? "?"} – ${l.budgetMax ?? "?"}</div>
            )}
            {l.location && <div className="text-sm mt-1">Location: {l.location}</div>}
            <p className="text-sm mt-2 line-clamp-3">{l.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
