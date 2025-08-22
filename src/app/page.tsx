import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Get recent listings (limit 3 for homepage preview)
  const listings = await db.buyerListing.findMany({
    include: { buyer: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center px-4 py-8">
      {/* Hero Section */}
      <header className="w-full max-w-2xl text-center mb-10">
        <Image
          src="/next.svg"
          alt="BuyerFirst Logo"
          width={120}
          height={32}
          className="mx-auto mb-4 dark:invert"
        />
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
          BuyerFirst
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Post what you want to buy. Get offers from trusted sellers.
        </p>
         <main className="p-6">
      <h1 className="text-2xl font-semibold">Browse niches</h1>
      <ul className="list-disc pl-5 mt-3 space-y-1">
        <li><Link href="/n/books" className="underline">Books</Link></li>
        <li><Link href="/n/vinyl" className="underline">Vinyl</Link></li>
        <li><Link href="/n/trading-cards" className="underline">Trading Cards</Link></li>
      </ul>
    </main>
    
        <div className="mt-6 flex justify-center gap-4">
          {session ? (
            <Link
              href="/listings/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Post a Buy Request
            </Link>
          ) : (
            <Link
              href="/signin?callbackUrl=/listings/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Sign in to Post
            </Link>
          )}
          <Link
            href="/listings"
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Browse Listings
          </Link>
        </div>
      </header>

      {/* Recent Buyer Listings */}
      <section className="w-full max-w-2xl mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Recent Buy Requests
        </h2>
        <ul className="space-y-4">
          {listings.map((l) => (
            <li
              key={l.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col sm:flex-row sm:items-center justify-between"
            >
              <div>
                <Link
                  href={`/listings/${l.id}`}
                  className="font-bold text-gray-900 dark:text-white hover:underline"
                >
                  {l.title}
                </Link>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {l.description}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  by @{l.buyer.username ?? l.buyer.email} •{" "}
                  {new Date(l.createdAt).toLocaleDateString()}
                </div>
                {(l.budgetMin || l.budgetMax) && (
                  <div className="text-xs mt-1">
                    Budget: ${l.budgetMin ?? "?"} – ${l.budgetMax ?? "?"}
                  </div>
                )}
                {l.location && (
                  <div className="text-xs mt-1">Location: {l.location}</div>
                )}
              </div>
              {session ? (
                <Link
                  href={`/listings/${l.id}`}
                  className="mt-2 sm:mt-0 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Make Offer
                </Link>
              ) : (
                <Link
                  href={`/signin?callbackUrl=/listings/${l.id}`}
                  className="mt-2 sm:mt-0 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Sign in to Offer
                </Link>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6 text-center">
          <Link
            href="/listings"
            className="text-blue-600 hover:underline font-medium"
          >
            See all listings →
          </Link>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="w-full max-w-2xl text-center">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
          Are you a seller?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Browse buyer requests and submit your best offer. Only logged-in users
          can make offers.
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
