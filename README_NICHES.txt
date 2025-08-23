BuyerFirst — Niches & Attributes

This project supports niche-specific listing fields (e.g., Books, Vinyl, Trading Cards) using a simple config + schema pattern:

Config: src/niches/def.ts — where you define each niche (slug, name, UI fields).

Validation: each niche has a Zod schema that validates listing.attributes on create/update.

Storage: attributes are stored as JSON in BuyerListing.attributes (no DB migrations required as you add/change fields).

DB linking: Niche table stores { id, slug, name } for referential integrity and filtering.

The New/Edit Listing forms and the Filters drawer auto-render inputs from the niche definition; filtering also auto-maps to JSON queries.

Files & Where Things Live

src/niches/def.ts
Central source of truth. Exposes:

NICHE_DEFS: a map of niche configs keyed by slug

listNiches(): returns [{ slug, name }]

Each entry includes:

slug, name

fields: UI + types (text, number, select)

schema: Zod schema for attributes

scripts/seed-niches.ts
Populates the Niche table from NICHE_DEFS (insert missing slugs, update names if changed).

Pages/components that use the niche definitions:

New listing form: src/app/listings/new/NewListingForm.tsx

Edit listing form: src/app/listings/[id]/EditListingForm.tsx

Filters drawer: src/components/FiltersPanel.tsx

Listing index: src/app/listings/page.tsx (niche-aware search & JSON filters)

Add a New Niche
1) Define it in src/niches/def.ts

Add a new entry to NICHE_DEFS:

// Example: Sneakers
export const NICHE_DEFS = {
  // ...existing niches...
  "sneakers": {
    slug: "sneakers",
    name: "Sneakers",
    fields: [
      { key: "brand", label: "Brand", type: "text", placeholder: "Nike, Adidas…" , required: true },
      { key: "model", label: "Model", type: "text", placeholder: "Air Jordan 1…" },
      { key: "size",  label: "Size (US)", type: "number", required: true },
      { key: "condition", label: "Condition", type: "select", options: ["New", "Used - Like New", "Used - Good", "Used - Fair"] }
    ],
    schema: z.object({
      brand: z.string().min(1),
      model: z.string().optional().default(""),
      size: z.coerce.number().positive(),
      condition: z.enum(["New", "Used - Like New", "Used - Good", "Used - Fair"]).optional()
    })
  },
} as const;


Field types supported in UI:

type: "text" → renders <input type="text">

type: "number" → renders <input type="number"> (remember to coerce in Zod with z.coerce.number())

type: "select" + options: string[] → renders <select>…</select>

The schema keys must match the fields[].key. Any field marked required: true should also be required in the Zod schema.

2) Seed the DB with the niche row

This ensures /listings filtering and FK relations work.

# from buyerfirst/
npm run seed:niches


This script:

Inserts missing Niche rows by slug

Updates name if changed

Does not delete niches (safe/idempotent)

3) Done — the UI updates automatically

New/Edit Listing forms now show the new niche + dynamic fields.

Filters drawer adds niche-specific filters when that niche is selected.

Validation: server validates attributes on POST/PUT with your Zod schema.

Change an Existing Niche
Rename display name

Edit name in NICHE_DEFS → run npm run seed:niches to sync the DB row’s name.

Add / remove / modify fields

Update fields and schema in def.ts.

No DB migration required (attributes are JSON).

Old listings keep their old attributes.

If you remove a field, old data persists in JSON but UI may no longer show it.

If you rename a field’s key, old data won’t match the new key (write a one-off migration if you need to rename keys).

Change a slug (⚠️ avoid)

Slugs are unique and used as stable IDs. Changing a slug breaks references in existing listings.

If you must rename:

Add a new niche entry with the new slug.

Backfill existing listings: set nicheId to the new niche’s id.

Remove the old slug when nothing references it.

How Filtering Works (Dynamic)

Filters drawer submits attr_<key>=<value> for any niche fields shown.

src/app/listings/page.tsx reads all attr_* parameters and, if a niche is selected:

text → attributes.path[key].string_contains (case-insensitive)

number → equality on number

select → equality on string

There’s also a generic “Attributes contain” text box (attrq) that does a broad string contains on the attributes JSON.

Deploying to Production

You must (a) deploy code changes and (b) seed the niche rows in the production DB.

A) Deploy app

Deploy as usual (Vercel/Render/Fly/etc.). Ensure env vars are set:

DATABASE_URL (Postgres)

NextAuth + providers (unchanged by niches)

B) Seed niches in prod

Run one of the following once per deploy if you changed NICHE_DEFS:

Option 1 — SSH / one-off job

# In your server/container shell (project root)
npm ci
npx prisma generate
npm run seed:niches


Option 2 — Temporary script route (quick & dirty)

Create a protected route that calls the same seed function from scripts/seed-niches.ts, run it once, then remove it.

Make sure it’s admin-guarded if you do this.

Option 3 — CI/CD step

Add a post-deploy step that runs the seed command against your production environment.

No Prisma migration is needed unless you change the Prisma schema (e.g., new models/columns). Adding/changing niches/attributes does not require a DB migration.

Common Pitfalls & Tips

Required number fields: In the Zod schema use z.coerce.number() so form values (strings) are coerced to numbers.

Select enums: keep options in UI and Zod z.enum([...]) in sync.

Don’t change slugs: treat slug as immutable stable IDs.

Seeding forgot: If the UI shows your niche but creating a listing fails with “Niche not found in DB”, you forgot to run npm run seed:niches.

Filter doesn’t apply: Make sure you passed the niche param in the URL; dynamic field filters only apply if a niche is selected.

Old data after field changes: Removing/renaming a field doesn’t mutate old attributes. Write a small one-off script if you need data migration.

Useful Commands
# Dev
npm run dev

# Prisma
npm run prisma:db:push
npx prisma studio

# Seed (local or prod shell)
npm run seed:niches

# Clean rebuild (Windows sometimes locks prisma engines)
rimraf .next node_modules/.prisma && npm ci && npx prisma generate

Example: Add “Cameras” niche

Add to src/niches/def.ts:

"cameras": {
  slug: "cameras",
  name: "Cameras",
  fields: [
    { key: "brand", label: "Brand", type: "text", required: true },
    { key: "model", label: "Model", type: "text" },
    { key: "mount", label: "Mount", type: "select", options: ["EF", "RF", "E", "F", "MFT"] },
    { key: "megapixels", label: "Megapixels", type: "number" },
  ],
  schema: z.object({
    brand: z.string().min(1),
    model: z.string().optional().default(""),
    mount: z.enum(["EF", "RF", "E", "F", "MFT"]).optional(),
    megapixels: z.coerce.number().positive().optional(),
  })
}


Seed:

npm run seed:niches


Verify:

/listings/new → choose Cameras and see fields

Filters → pick Cameras then see dynamic filters appear