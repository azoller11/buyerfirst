import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.user.findUnique({ where: { email: session.user.email } });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { listingId, priceCents, note } = await req.json();
  if (!listingId || !priceCents) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const listing = await db.buyerListing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.buyerId === me.id) return NextResponse.json({ error: "Cannot offer on your own listing" }, { status: 400 });

  const offer = await db.offer.create({
    data: { listingId, sellerId: me.id, priceCents: Number(priceCents), note: note ?? null },
  });

  return NextResponse.json(offer, { status: 201 });
}
