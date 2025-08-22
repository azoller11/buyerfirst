import { z } from "zod";

export type FieldType = "text" | "number" | "select";
export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: readonly string[]; // for select
  required?: boolean;
};

export type NicheDef = {
  slug: string;
  name: string;
  fields: readonly FieldDef[];
  // Zod schema validating attributes JSON
  schema: z.ZodType<Record<string, unknown>>;
};

/** ---------- Examples ---------- **/

export const bookFields = [
  { key: "author", label: "Author", type: "text", required: true, placeholder: "e.g., Ursula K. Le Guin" },
  { key: "titleExact", label: "Title (exact)", type: "text", required: true, placeholder: "The Left Hand of Darkness" },
  { key: "isbn", label: "ISBN", type: "text", placeholder: "978-0441478125" },
  { key: "condition", label: "Condition", type: "select", options: ["Any","New","Like New","Very Good","Good","Acceptable"] as const },
] as const satisfies readonly FieldDef[];

export const bookSchema = z.object({
  author: z.string().min(1),
  titleExact: z.string().min(1),
  isbn: z.string().trim().optional().or(z.literal("")),
  condition: z.enum(["Any","New","Like New","Very Good","Good","Acceptable"]).optional(),
});

export const vinylFields = [
  { key: "artist", label: "Artist", type: "text", required: true, placeholder: "e.g., Pink Floyd" },
  { key: "album", label: "Album", type: "text", required: true, placeholder: "The Dark Side of the Moon" },
  { key: "pressing", label: "Pressing/Edition", type: "text", placeholder: "2016 remaster, UK first press..." },
  { key: "grading", label: "Grading", type: "select", options: ["Any","M","NM","VG+","VG","G"] as const },
] as const;

export const vinylSchema = z.object({
  artist: z.string().min(1),
  album: z.string().min(1),
  pressing: z.string().optional().or(z.literal("")),
  grading: z.enum(["Any","M","NM","VG+","VG","G"]).optional(),
});

export const tradingCardFields = [
  { key: "player", label: "Player/Character", type: "text", required: true },
  { key: "year", label: "Year", type: "number", required: false, placeholder: "e.g., 1996" },
  { key: "setName", label: "Set/Series", type: "text", required: false, placeholder: "Topps Chrome, Base Set 1st..." },
  { key: "grade", label: "Grade", type: "select", options: ["Any","PSA 10","PSA 9","BGS 9.5","BGS 9","Raw"] as const },
] as const;

export const tradingCardSchema = z.object({
  player: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  setName: z.string().optional().or(z.literal("")),
  grade: z.enum(["Any","PSA 10","PSA 9","BGS 9.5","BGS 9","Raw"]).optional(),
});

/** ---------- Registry ---------- **/

export const NICHE_DEFS = {
  books: {
    slug: "books",
    name: "Books",
    fields: bookFields,
    schema: bookSchema,
  },
  vinyl: {
    slug: "vinyl",
    name: "Vinyl",
    fields: vinylFields,
    schema: vinylSchema,
  },
  "trading-cards": {
    slug: "trading-cards",
    name: "Trading Cards",
    fields: tradingCardFields,
    schema: tradingCardSchema,
  },
} as const satisfies Record<string, NicheDef>;

export type NicheSlug = keyof typeof NICHE_DEFS;

/** helper */
export function listNiches(): ReadonlyArray<Pick<NicheDef, "slug" | "name">> {
  return Object.values(NICHE_DEFS).map(({ slug, name }) => ({ slug, name }));
}
