import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ListingStatus } from "@prisma/client";

export default async function MyListingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">My Listings</h1>
        <div className="text-gray-600">You must be signed in to view your listings.</div>
        <Link href="/signin?callbackUrl=/listings/mine" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">
          Sign in
        </Link>
      </main>
    );
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: { listings: true },
  });

  if (!user || !user.listings.length) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">My Listings</h1>
        <div className="text-gray-600">You have not posted any listings yet.</div>
        <Link href="/listings/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">
          Post a Listing
        </Link>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">My Listings</h1>
      <ul className="space-y-6">
        {user.listings.map((l) => (
          <li key={l.id} className="border rounded-lg p-4 bg-white dark:bg-gray-900 shadow">
            <div className="flex items-center gap-4">
              {l.photos && l.photos.length > 0 && l.photos[0] && (
                <img
                  src={l.photos[0]}
                  alt={l.title}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <Link href={`/listings/${l.id}`} className="font-bold text-lg hover:underline">
                  {l.title}
                </Link>
                <div className="text-sm text-gray-600 mt-1">
                  {new Date(l.createdAt).toLocaleDateString()} • Status: <span className="font-semibold">{l.status}</span>
                </div>
                <p className="text-sm mt-2 line-clamp-2">{l.description}</p>
                {(l.budgetMin || l.budgetMax) && (
                  <div className="text-sm mt-1">
                    Budget: ${l.budgetMin ?? "?"} – ${l.budgetMax ?? "?"}
                  </div>
                )}
                {l.location && <div className="text-sm mt-1">Location: {l.location}</div>}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/listings/${l.id}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Edit
              </Link>
              <form
                action={`/api/listings/${l.id}/delete`}
                method="POST"
              >
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </form>
              {l.status !== "FULFILLED" && (
                <form
                  action={`/api/listings/${l.id}/mark-bought`}
                  method="POST"
                >
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">
                    Mark as Bought
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}