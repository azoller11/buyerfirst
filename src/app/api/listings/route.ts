// src/app/api/listings/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NICHE_DEFS, type NicheSlug } from "@/niches/def";
import { Prisma } from "@prisma/client";

export async function GET() {
  // optional: simple health check
  return NextResponse.json({ ok: true, route: "/api/listings" });
}

export async function POST(req: Request) {
  const trace = { step: "start" as string, note: "" };
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized (please sign in)", trace }, { status: 401 });
    }

    const me = await db.user.findUnique({ where: { email: session.user.email } });
    if (!me) return NextResponse.json({ error: "User not found", trace }, { status: 404 });

    trace.step = "parse-body";
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON", trace }, { status: 400 });

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

    trace.step = "basic-validate";
    if (!nicheSlug) return NextResponse.json({ error: "Please choose a niche", trace }, { status: 400 });
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required", trace }, { status: 400 });
    }

    trace.step = "lookup-def";
    const def = NICHE_DEFS[nicheSlug as NicheSlug];
    if (!def) {
      trace.note = `client nicheSlug="${nicheSlug}" not in NICHE_DEFS`;
      return NextResponse.json({ error: `Unknown niche "${nicheSlug}"`, trace }, { status: 400 });
    }

    trace.step = "zod-validate";
    const parsed = def.schema.safeParse(attributes ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid niche details", details: parsed.error.flatten(), trace },
        { status: 400 }
      );
    }

    trace.step = "find-niche-row";
    const niche = await db.niche.findUnique({ where: { slug: def.slug } });
    if (!niche) {
      trace.note = `niche slug "${def.slug}" missing in DB — run seed`;
      return NextResponse.json(
        { error: "Niche not found in DB. Run: npm run seed:niches", trace },
        { status: 500 }
      );
    }

    trace.step = "create";
    const listing = await db.buyerListing.create({
      data: {
        buyerId: me.id,
        nicheId: niche.id,
        title: String(title).trim(),
        description: String(description).trim(),
        photos: Array.isArray(photos) ? photos.map(String).slice(0, 10) : [],
        budgetMin: budgetMin ?? null,
        budgetMax: budgetMax ?? null,
        location: location ?? null,
        attributes: parsed.data as Prisma.InputJsonValue,
      },
      include: { buyer: true, niche: true },
    });

    trace.step = "done";
    return NextResponse.json(listing, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    console.error("POST /api/listings failed", { trace, errMessage: err?.message, err });
    return NextResponse.json(
      { error: "Server error creating listing", trace, err: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
