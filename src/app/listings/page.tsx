import Link from "next/link";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function ListingsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; page?: string; view?: string }> }) {
  const session = await getServerSession(authOptions);
  const { q = "", page = "1", view = "list" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const where: Prisma.BuyerListingWhereInput = q
    ? {
        OR: [
          { title:       { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { location:    { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [listings, total] = await Promise.all([
    db.buyerListing.findMany({
      where,
      include: { buyer: true },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.buyerListing.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Buyer Listings</h1>
      <form className="mt-4 flex gap-2 items-center">
        <input name="q" defaultValue={q} placeholder="Search…" className="border p-2 w-full" />
        <input type="hidden" name="view" value={view} />
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Search</button>
      </form>

      <div className="flex justify-between items-center mt-4 mb-2">
        <div className="flex gap-2">
          <form method="GET">
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="page" value={pageNum} />
            <input type="hidden" name="view" value="list" />
            <button
              type="submit"
              className={`px-3 py-1 rounded ${view === "list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              List
            </button>
          </form>
          <form method="GET">
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="page" value={pageNum} />
            <input type="hidden" name="view" value="grid" />
            <button
              type="submit"
              className={`px-3 py-1 rounded ${view === "grid" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Grid
            </button>
          </form>
        </div>
        <div className="text-sm text-gray-600">
          Showing {listings.length} of {total} results
        </div>
      </div>

      {/* Listings */}
      {view === "grid" ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {listings.map((l) => (
            <li key={l.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900 shadow">
              {l.photos && l.photos.length > 0 && l.photos[0] && (
                <img
                  src={l.photos[0]}
                  alt={l.title}
                  className="w-full h-40 object-cover rounded mb-2"
                />
              )}
              <Link href={`/listings/${l.id}`} className="font-medium underline text-lg">
                {l.title}
              </Link>
              <div className="text-sm text-gray-600 mt-1">
                by @{l.buyer.username ?? l.buyer.email} • {new Date(l.createdAt).toLocaleDateString()}
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer font-semibold text-blue-600">Details</summary>
                <div className="mt-2">
                  <p className="text-sm mb-2">{l.description}</p>
                  {l.location && <div className="text-sm mb-1">Location: {l.location}</div>}
                  {session && (l.budgetMin || l.budgetMax) && (
                    <div className="text-sm mb-1">
                      Budget: ${l.budgetMin ?? "?"} – ${l.budgetMax ?? "?"}
                    </div>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {listings.map((l) => (
            <li key={l.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900 shadow flex gap-4">
              {l.photos && l.photos.length > 0 && l.photos[0] && (
                <img
                  src={l.photos[0]}
                  alt={l.title}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <Link href={`/listings/${l.id}`} className="font-medium underline text-lg">
                  {l.title}
                </Link>
                <div className="text-sm text-gray-600 mt-1">
                  by @{l.buyer.username ?? l.buyer.email} • {new Date(l.createdAt).toLocaleDateString()}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold text-blue-600">Details</summary>
                  <div className="mt-2">
                    <p className="text-sm mb-2">{l.description}</p>
                    {l.location && <div className="text-sm mb-1">Location: {l.location}</div>}
                    {session && (l.budgetMin || l.budgetMax) && (
                      <div className="text-sm mb-1">
                        Budget: ${l.budgetMin ?? "?"} – ${l.budgetMax ?? "?"}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <form method="GET">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="page" value={pageNum - 1} />
          <button
            type="submit"
            disabled={pageNum <= 1}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
        </form>
        <span className="px-2 text-sm font-medium">
          Page {pageNum} of {totalPages}
        </span>
        <form method="GET">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="page" value={pageNum + 1} />
          <button
            type="submit"
            disabled={pageNum >= totalPages}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </form>
      </div>
    </main>
  );
}
