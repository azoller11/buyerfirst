import Link from "next/link";
import { db } from "@/lib/db";
import { Prisma, ListingStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FiltersPanel from "@/components/FiltersPanel";
import { NICHE_DEFS, type NicheSlug } from "@/niches/def";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

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

function NicheBadge({ nicheName }: { nicheName?: string | null }) {
  return (
    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 border shrink-0">
      {nicheName ?? "Uncategorized"}
    </span>
  );
}

function AttrPills({
  nicheSlug,
  attributes,
  max = 4,
}: {
  nicheSlug?: string | null;
  attributes: unknown;
  max?: number;
}) {
  if (!nicheSlug) return null;
  const def = NICHE_DEFS[nicheSlug as NicheSlug];
  if (!def) return null;

  const attrs = (attributes ?? {}) as Record<string, unknown>;
  const entries: Array<{ label: string; value: string }> = [];
  for (const f of def.fields) {
    const raw = attrs[f.key];
    if (raw === undefined || raw === null || raw === "") continue;
    entries.push({ label: f.label, value: String(raw) });
  }
  if (!entries.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.slice(0, max).map((e) => (
        <span
          key={e.label}
          className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 border"
          title={`${e.label}: ${e.value}`}
        >
          <span className="font-medium mr-1">{e.label}:</span>
          <span className="truncate max-w-[10rem]">{e.value}</span>
        </span>
      ))}
      {entries.length > max && (
        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-50 border">
          +{entries.length - max} more
        </span>
      )}
    </div>
  );
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    view?: string;
    niche?: string;
    status?: string;
    min?: string;
    max?: string;
    loc?: string;
    attrq?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  // Top search + filters (right sidebar)
  const {
    q = "",
    page = "1",
    view = "list",
    niche = "",
    status = "",
    min = "",
    max = "",
    loc = "",
    attrq = "",
  } = params;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  // Build Prisma where
  const where: Prisma.BuyerListingWhereInput = {};
  const ors: Prisma.BuyerListingWhereInput[] = [];

  if (q) {
    ors.push(
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    );
    // best-effort JSON text search
    ors.push({ attributes: { equals: q } });
  }
  if (ors.length) where.OR = ors;

  if (niche) where.niche = { slug: niche };

  if (status) {
    const parts = status.split(",").map((s) => s.trim()).filter(Boolean) as ListingStatus[];
    if (parts.length) where.status = { in: parts };
  }

  if (loc) where.location = { contains: loc, mode: "insensitive" };

  const minNum = min ? Number(min) : undefined;
  const maxNum = max ? Number(max) : undefined;
  if (minNum !== undefined || maxNum !== undefined) {
    where.AND = where.AND ?? [];
    const ands: Prisma.BuyerListingWhereInput[] = [];
    if (minNum !== undefined) {
      ands.push({ OR: [{ budgetMax: null }, { budgetMax: { gte: minNum } }] });
    }
    if (maxNum !== undefined) {
      ands.push({ OR: [{ budgetMin: null }, { budgetMin: { lte: maxNum } }] });
    }
    (where.AND as Prisma.BuyerListingWhereInput[]).push(...ands);
  }

  if (attrq) {
    if (!Array.isArray(where.AND)) where.AND = [];
    // You may want to add attribute query logic here
  }
  const [listings, total] = await Promise.all([
    db.buyerListing.findMany({
      where,
      include: { buyer: true, niche: true },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }), 
    db.buyerListing.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* Top search bar */}
     <div className="flex items-center justify-between gap-3">
  <form className="flex-1">
    <input
      name="q"
      defaultValue={q}
      placeholder="Search listings…"
      className="border p-2 w-full rounded"
    />
          {/* keep current filters when searching */}
          <input type="hidden" name="niche" value={niche} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="min" value={min} />
          <input type="hidden" name="max" value={max} />
          <input type="hidden" name="loc" value={loc} />
          <input type="hidden" name="attrq" value={attrq} />
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="view" value={view} />
        </form>

        {/* Filters button (mobile) lives inside the component, and
            sidebar (desktop) will render on the right */}
        <FiltersPanel defaults={{ q, niche, status, min, max, loc, attrq, view }} />
      </div>

      {/* Content with right-hand filters: we fake the layout by placing
          the filters component at top (mobile) and at right (desktop). */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr),280px] gap-6">
        {/* Results (left) */}
        <section className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-gray-600">
              Showing {listings.length} of {total} results
            </div>
            <div className="flex gap-2">
              <form method="GET">
                <input type="hidden" name="q" value={q} />
                <input type="hidden" name="niche" value={niche} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="min" value={min} />
                <input type="hidden" name="max" value={max} />
                <input type="hidden" name="loc" value={loc} />
                <input type="hidden" name="attrq" value={attrq} />
                <input type="hidden" name="page" value={pageNum} />
                <input type="hidden" name="view" value="list" />
                <button
                  type="submit"
                  className={`px-3 py-1 rounded ${"list" === "list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  List
                </button>
              </form>
              <form method="GET">
                <input type="hidden" name="q" value={q} />
                <input type="hidden" name="niche" value={niche} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="min" value={min} />
                <input type="hidden" name="max" value={max} />
                <input type="hidden" name="loc" value={loc} />
                <input type="hidden" name="attrq" value={attrq} />
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
          </div>

          {/* Listings */}
          {/* GRID */}
          {params.view === "grid" ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <li key={l.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900 shadow">
                  {/* Bigger uniform image — not cropped */}
                  <div className="w-full h-64 bg-gray-50 border rounded mb-2 flex items-center justify-center overflow-hidden">
                    {l.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photos[0]} alt={l.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="text-xs text-gray-400">No photo</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/listings/${l.id}`} className="font-medium underline text-base truncate">
                      {l.title}
                    </Link>
                    <NicheBadge nicheName={l.niche?.name} />
                    <StatusBadge status={l.status} />
                  </div>

                  <div className="text-xs text-gray-600 mt-1">
                    by @{l.buyer.username ?? l.buyer.email} • {new Date(l.createdAt).toLocaleDateString()}
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer font-semibold text-blue-600">Details</summary>
                    <div className="mt-2">
                      <p className="text-sm mb-2 line-clamp-4">{l.description}</p>
                      {l.location && <div className="text-sm mb-1">Location: {l.location}</div>}
                      {session && (l.budgetMin || l.budgetMax) && (
                        <div className="text-sm mb-1">
                          Budget: ${l.budgetMin ?? "?"} – ${l.budgetMax ?? "?"}
                        </div>
                      )}
                      <AttrPills nicheSlug={l.niche?.slug} attributes={l.attributes} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            // LIST
            <ul className="mt-4 flex flex-col gap-4">
              {listings.map((l) => (
                <li key={l.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900 shadow flex gap-4">
                  <div className="w-48 h-32 bg-gray-50 border rounded flex items-center justify-center overflow-hidden shrink-0">
                    {l.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photos[0]} alt={l.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="text-xs text-gray-400">No photo</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/listings/${l.id}`} className="font-medium underline text-lg truncate">
                        {l.title}
                      </Link>
                      <NicheBadge nicheName={l.niche?.name} />
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      by @{l.buyer.username ?? l.buyer.email} • {new Date(l.createdAt).toLocaleDateString()}
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold text-blue-600">Details</summary>
                      <div className="mt-2">
                        <p className="text-sm mb-2 line-clamp-4">{l.description}</p>
                        {l.location && <div className="text-sm mb-1">Location: {l.location}</div>}
                        {session && (l.budgetMin || l.budgetMax) && (
                          <div className="text-sm mb-1">
                            Budget: ${l.budgetMin ?? "?"} – ${l.budgetMax ?? "?"}
                          </div>
                        )}
                        <AttrPills nicheSlug={l.niche?.slug} attributes={l.attributes} />
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
              <input type="hidden" name="niche" value={niche} />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="min" value={min} />
              <input type="hidden" name="max" value={max} />
              <input type="hidden" name="loc" value={loc} />
              <input type="hidden" name="attrq" value={attrq} />
              <input type="hidden" name="view" value={view} />
              <input type="hidden" name="page" value={pageNum - 1} />
              <button type="submit" disabled={pageNum <= 1} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">
                Prev
              </button>
            </form>
            <span className="px-2 text-sm font-medium">Page {pageNum} of {totalPages}</span>
            <form method="GET">
              <input type="hidden" name="q" value={q} />
              <input type="hidden" name="niche" value={niche} />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="min" value={min} />
              <input type="hidden" name="max" value={max} />
              <input type="hidden" name="loc" value={loc} />
              <input type="hidden" name="attrq" value={attrq} />
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
        </section>

        {/* Right-hand filters (desktop) are rendered by FiltersPanel via CSS; nothing else to place here */}
        <div className="hidden md:block" />
      </div>
    </main>
  );
}
