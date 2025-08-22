// app/api/listings/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await db.user.findUnique({ where: { email: session.user.email } });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const location = body.location ? String(body.location).trim() : null;
    const budgetMin = body.budgetMin == null ? null : Number(body.budgetMin);
    const budgetMax = body.budgetMax == null ? null : Number(body.budgetMax);
    const photos: string[] = Array.isArray(body.photos) ? body.photos.map(String).slice(0, 10) : [];

    if (!title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (Number.isNaN(budgetMin as number) || Number.isNaN(budgetMax as number)) {
      return NextResponse.json({ error: "Budget must be numbers or null" }, { status: 400 });
    }

    const listing = await db.buyerListing.create({
      data: {
        buyerId: me.id,
        title,
        description,
        photos,
        budgetMin,
        budgetMax,
        location,
      },
      include: { buyer: { select: { id: true, username: true, email: true } } },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error("POST /api/listings error:", err);
    return NextResponse.json({ error: "Server error creating listing" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { location: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const listings = await db.buyerListing.findMany({
    where,
    include: { buyer: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(listings);
}
