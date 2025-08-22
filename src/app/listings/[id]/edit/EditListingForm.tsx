"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { NICHE_DEFS, type NicheSlug, type FieldDef, listNiches } from "@/niches/def";

type ListingForEdit = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  photos: string[];
  nicheSlug: NicheSlug | "";                    // may be empty for old rows
  attributes: Record<string, unknown>;
};

export default function EditListingForm({ listing }: { listing: ListingForEdit }) {
  const r = useRouter();

  // Standard
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [location, setLocation] = useState(listing.location ?? "");
  const [budgetMin, setBudgetMin] = useState<string>(listing.budgetMin?.toString() ?? "");
  const [budgetMax, setBudgetMax] = useState<string>(listing.budgetMax?.toString() ?? "");
  const [photoInputs, setPhotoInputs] = useState<string[]>(listing.photos.length ? listing.photos : [""]);

  // Niche + dynamic
  const [nicheSlug, setNicheSlug] = useState<NicheSlug | "">(listing.nicheSlug);
  const [attrs, setAttrs] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(listing.attributes ?? {}).map(([k, v]) => [k, String(v ?? "")]))
  );

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const niches = useMemo(() => listNiches(), []);
  const def = nicheSlug ? NICHE_DEFS[nicheSlug] : undefined;

  const setPhotoAt = (i: number, v: string) => {
    const next = photoInputs.slice();
    next[i] = v;
    setPhotoInputs(next);
  };

  function onFieldChange(field: FieldDef, value: string) {
    setAttrs(prev => ({ ...prev, [field.key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // Build attributes only if a niche is selected
    const attributes = def
      ? Object.fromEntries(def.fields.map(f => [f.key, attrs[f.key] ?? ""]))
      : {};

    // If a niche is selected, enforce required fields client-side
    if (def) {
      for (const f of def.fields) {
        if ("required" in f && f.required && !String(attributes[f.key] ?? "").trim()) {
          setErr(`Please fill "${f.label}".`);
          setLoading(false);
          return;
        }
      }
    }

    const res = await fetch(`/api/listings/${listing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nicheSlug: nicheSlug || undefined,  // undefined means "keep or remain uncategorized"
        attributes: def ? attributes : undefined, // only send if niche selected
        title,
        description,
        location: location || null,
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        photos: photoInputs.filter(Boolean),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      let msg = "Failed to update listing";
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch { /* ignore */ }
      setErr(msg);
      return;
    }

    r.push(`/listings/${listing.id}`);
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Edit Listing</h1>
      <form onSubmit={submit} className="space-y-4">
        {/* Niche selector (may be empty) */}
        <div>
          <label className="block text-sm mb-1">Niche</label>
          <select
            className="border p-2 w-full"
            value={nicheSlug}
            onChange={(e) => {
              const val = e.target.value as NicheSlug | "";
              setNicheSlug(val);
              setAttrs({}); // reset attrs when switching
            }}
          >
            <option value="">Uncategorized</option>
            {niches.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <input className="border p-2 w-full" placeholder="Item name / title"
               value={title} onChange={e=>setTitle(e.target.value)} required />
        <textarea className="border p-2 w-full" rows={5}
                  placeholder="Describe condition, specs, must-haves, timing…"
                  value={description} onChange={e=>setDescription(e.target.value)} required />
        <div className="flex gap-2">
          <input className="border p-2 w-full" type="number" placeholder="Budget min (optional)"
                 value={budgetMin} onChange={(e)=>setBudgetMin(e.target.value)} />
          <input className="border p-2 w-full" type="number" placeholder="Budget max (optional)"
                 value={budgetMax} onChange={(e)=>setBudgetMax(e.target.value)} />
        </div>
        <input className="border p-2 w-full" placeholder="Location (optional)"
               value={location} onChange={e=>setLocation(e.target.value)} />

        {/* Photos */}
        <div className="space-y-2">
          <div className="font-medium">Photo URLs</div>
          {photoInputs.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input className="border p-2 w-full" placeholder="https://…"
                     value={p} onChange={e=>setPhotoAt(i, e.target.value)} />
              {i === photoInputs.length - 1 ? (
                <button type="button" className="border px-3"
                        onClick={()=>setPhotoInputs([...photoInputs, ""])}>+ Add</button>
              ) : (
                <button type="button" className="border px-3"
                        onClick={()=>setPhotoInputs(photoInputs.filter((_,j)=>j!==i))}>Remove</button>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic niche-specific fields (only when selected) */}
        {def && (
          <div className="space-y-2">
            <div className="font-medium">Details for {def.name}</div>
            {def.fields.map((f) => {
              const commonProps = {
                id: f.key,
                required: "required" in f ? (f.required as boolean) : false,
                placeholder: "placeholder" in f ? f.placeholder : undefined,
                className: "border p-2 w-full",
                value: attrs[f.key] ?? "",
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                  onFieldChange(f, e.target.value),
              };
              if (f.type === "select") {
                return (
                  <select key={f.key} {...commonProps}>
                    <option value="">{f.label} (choose one)</option>
                    {f.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                );
              }
              return (
                <input
                  key={f.key}
                  {...commonProps}
                  type={f.type === "number" ? "number" : "text"}
                  aria-label={f.label}
                />
              );
            })}
          </div>
        )}

        {err && <div className="text-sm text-red-600">{err}</div>}
        <button disabled={loading} className="bg-black text-white px-4 py-2">
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </main>
  );
}
