import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import FiltersPanel from "@/components/FiltersPanel";
import { listNiches, NICHE_DEFS, type NicheSlug } from "@/niches/def";
import { ListingStatus } from "@prisma/client";

function StatusBadge({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, string> = {
    OPEN: "bg-green-100 text-green-800 border-green-200",
    REVIEWING: "bg-amber-100 text-amber-800 border-amber-200",
    ACCEPTED: "bg-blue-100 text-blue-800 border-blue-200",
    FULFILLED: "bg-gray-100 text-gray-700 border-gray-200",
    EXPIRED: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${map[status]} shrink-0`}>
      {status}
    </span>
  );
}

function NicheBadge({ slug }: { slug?: string | null }) {
  const name = slug ? NICHE_DEFS[slug as NicheSlug]?.name ?? "Uncategorized" : "Uncategorized";
  return (
    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 border shrink-0">
      {name}
    </span>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  const listings = await db.buyerListing.findMany({
    include: { buyer: true, niche: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const niches = listNiches();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      {/* HERO */}
      <header className="max-w-6xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Image src="/next.svg" alt="BuyerFirst" width={120} height={32} className="dark:invert" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white">
          BuyerFirst
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          A reverse marketplace—post what you want to buy, let sellers come to you.
        </p>

        {/* Top search + niche selector + filters button */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center">
          {/* Search form submits to /listings and preserves view=grid by default */}
          <form action="/listings" className="flex-1 max-w-2xl">
            <input
              name="q"
              placeholder="Search listings…"
              className="border p-3 w-full rounded"
            />
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="view" value="grid" />
          </form>

          {/* Niche quick-jump */}
          <form action="/listings" className="flex items-center gap-2">
            <select name="niche" className="border p-3 rounded min-w-[190px]">
              <option value="">All niches</option>
              {niches.map(n => (
                <option key={n.slug} value={n.slug}>{n.name}</option>
              ))}
            </select>
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="view" value="grid" />
            <button className="px-4 py-3 bg-gray-900 text-white rounded hover:opacity-90">
              Browse
            </button>
          </form>

          {/* Filters drawer (closed by default) */}
          <FiltersPanel defaults={{ view: "grid" }} />
        </div>

        {/* CTAs */}
        <div className="mt-6 flex justify-center gap-3">
          {session ? (
            <Link
              href="/listings/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition"
            >
              Post a Buy Request
            </Link>
          ) : (
            <Link
              href="/signin?callbackUrl=/listings/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition"
            >
              Sign in to Post
            </Link>
          )}
          <Link
            href="/listings"
            className="bg-white dark:bg-gray-900 border hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-semibold py-2.5 px-5 rounded-lg transition"
          >
            Browse Listings
          </Link>
        </div>
      </header>

      {/* RECENT LISTINGS */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Buy Requests</h2>
          <Link href="/listings" className="text-blue-600 hover:underline">See all →</Link>
        </div>

        {/* Grid cards, uniform images (object-contain) */}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <li key={l.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900 shadow">
              <div className="w-full h-56 bg-gray-50 border rounded mb-2 flex items-center justify-center overflow-hidden">
                {l.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.photos[0]}
                    alt={l.title}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-gray-400">No photo</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/listings/${l.id}`} className="font-medium underline text-base truncate">
                  {l.title}
                </Link>
                <NicheBadge slug={l.niche?.slug} />
                <StatusBadge status={l.status} />
              </div>

              <div className="text-xs text-gray-600 mt-1">
                by @{l.buyer.username ?? l.buyer.email} • {new Date(l.createdAt).toLocaleDateString()}
              </div>

              <p className="text-sm mt-2 line-clamp-3">{l.description}</p>

              <div className="mt-3 flex gap-2">
                {session ? (
                  <Link
                    href={`/listings/${l.id}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm"
                  >
                    Make Offer
                  </Link>
                ) : (
                  <Link
                    href={`/signin?callbackUrl=/listings/${l.id}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm"
                  >
                    Sign in to Offer
                  </Link>
                )}
                <Link
                  href={`/listings/${l.id}`}
                  className="border px-3 py-1.5 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* SELLER CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16 text-center">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Are you a seller?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Browse buyer requests and submit your best offer. Only logged-in users can make offers.
        </p>
        <Link
          href="/listings"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Browse & Offer
        </Link>
      </section>
    </div>
  );
}
