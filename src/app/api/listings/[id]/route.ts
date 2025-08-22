import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NICHE_DEFS, type NicheSlug } from "@/niches/def";
import { Prisma } from "@prisma/client";

// Optional: a quick GET to verify the route works
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const listing = await db.buyerListing.findUnique({
    where: { id: params.id },
    include: { buyer: true, niche: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized (please sign in)" }, { status: 401 });
    }

    const me = await db.user.findUnique({ where: { email: session.user.email } });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await db.buyerListing.findUnique({
      where: { id: params.id },
      include: { niche: true },
    });
    if (!existing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (existing.buyerId !== me.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      nicheSlug,
      attributes,
      title,
      description,
      photos,
      budgetMin,
      budgetMax,
      location,
    } = body as {
      nicheSlug?: string;
      attributes?: Record<string, unknown>;
      title?: string;
      description?: string;
      photos?: string[];
      budgetMin?: number | null;
      budgetMax?: number | null;
      location?: string | null;
    };

    // Work out niche + validated attributes
    let relationUpdate:
      | { disconnect: true }
      | { connect: { id: string } }
      | undefined;
    let attrsToSet: Prisma.InputJsonValue | null | undefined;

    if (typeof nicheSlug === "string") {
      if (nicheSlug === "") {
        relationUpdate = { disconnect: true };
        attrsToSet = null;
      } else {
        const def = NICHE_DEFS[nicheSlug as NicheSlug];
        if (!def) return NextResponse.json({ error: "Unknown niche" }, { status: 400 });

        const niche = await db.niche.findUnique({ where: { slug: def.slug } });
        if (!niche) {
          return NextResponse.json(
            { error: "Niche not found in DB. Run: npm run seed:niches" },
            { status: 500 }
          );
        }

        relationUpdate = { connect: { id: niche.id } };

        if (attributes) {
          const parsed = def.schema.safeParse(attributes);
          if (!parsed.success) {
            return NextResponse.json(
              { error: "Invalid attributes", details: parsed.error.flatten() },
              { status: 400 }
            );
          }
          attrsToSet = parsed.data as Prisma.InputJsonValue;
        } else {
          attrsToSet = null; // switching niche but no attrs -> clear
        }
      }
    } else if (attributes) {
      const currentSlug = existing.niche?.slug as NicheSlug | undefined;
      const def = currentSlug ? NICHE_DEFS[currentSlug] : undefined;
      if (def) {
        const parsed = def.schema.safeParse(attributes);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid attributes", details: parsed.error.flatten() },
            { status: 400 }
          );
        }
        attrsToSet = parsed.data as Prisma.InputJsonValue;
      } else {
        attrsToSet = null;
      }
    }

    // Build update object using the relation field (not nicheId) to satisfy Prisma's checked type
    const data: Prisma.BuyerListingUpdateInput = {};
    if (relationUpdate) data.niche = relationUpdate;
    if (attrsToSet !== undefined) {
      data.attributes = attrsToSet === null ? Prisma.JsonNull : attrsToSet;
    }
    if (title !== undefined) data.title = String(title).trim();
    if (description !== undefined) data.description = String(description).trim();
    if (Array.isArray(photos)) data.photos = photos.map(String).slice(0, 10);
    if (budgetMin !== undefined) data.budgetMin = budgetMin ?? null;
    if (budgetMax !== undefined) data.budgetMax = budgetMax ?? null;
    if (location !== undefined) data.location = location ?? null;

    const updated = await db.buyerListing.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    console.error("PUT /api/listings/[id] failed", e);
    return NextResponse.json({ error: "Server error updating listing" }, { status: 500 });
  }
}

// (optional) delete listing
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const deleted = await db.buyerListing.delete({ where: { id: params.id } });
  return NextResponse.json(deleted);
}
