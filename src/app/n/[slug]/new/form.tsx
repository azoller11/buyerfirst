"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NICHE_DEFS, type NicheSlug, type FieldDef } from "../../../../niches/def";

type Props = { slug: NicheSlug };

export default function NewNicheListingForm({ slug }: Props) {
  const r = useRouter();
  const def = NICHE_DEFS[slug];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [photoInputs, setPhotoInputs] = useState<string[]>([""]);
  const [attrs, setAttrs] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // build attributes payload as strings; server will coerce via zod
    const attributes = Object.fromEntries(
      def.fields.map(f => [f.key, attrs[f.key] ?? ""])
    );

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nicheSlug: def.slug,
        attributes,
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
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Failed to create listing");
      console.log('Here? ' + res);
      if (res.status === 401) window.location.href = "/signin?callbackUrl=/";
      return;
    }
    const listing = await res.json();
    r.push(`/listings/${listing.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input className="border p-2 w-full" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
      <textarea className="border p-2 w-full" rows={5} placeholder="Describe condition, specs, must-haves, timing…"
        value={description} onChange={e=>setDescription(e.target.value)} required />

      {/* Dynamic niche-specific fields */}
      <div className="space-y-2">
        <div className="font-medium">Details for {def.name}</div>
        {def.fields.map((f) => {
          const common = {
            key: f.key,
            id: f.key,
            required: "required" in f ? !!f.required : false,
            placeholder: f.label,
            className: "border p-2 w-full",
            value: (attrs[f.key] ?? "") as string,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFieldChange(f, e.target.value),
          };
          if (f.type === "select") {
            return (
              <select {...common} key={f.key}>
                <option value="">{f.label} (choose one)</option>
                {f.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            );
          }
          return <input {...common} key={f.key} type={f.type === "number" ? "number" : "text"} aria-label={f.label} />;
        })}
      </div>

      <div className="flex gap-2">
        <input className="border p-2 w-full" type="number" placeholder="Budget min (optional)"
               value={budgetMin} onChange={e=>setBudgetMin(e.target.value)} />
        <input className="border p-2 w-full" type="number" placeholder="Budget max (optional)"
               value={budgetMax} onChange={e=>setBudgetMax(e.target.value)} />
      </div>

      <input className="border p-2 w-full" placeholder="Location (optional)"
             value={location} onChange={e=>setLocation(e.target.value)} />

      <div className="space-y-2">
        <div className="font-medium">Photo URLs (MVP)</div>
        {photoInputs.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input className="border p-2 w-full" placeholder="https://…" value={p}
                   onChange={e=>setPhotoAt(i, e.target.value)} />
            {i === photoInputs.length - 1 ? (
              <button type="button" className="border px-3" onClick={()=>setPhotoInputs([...photoInputs, ""])}>+ Add</button>
            ) : (
              <button type="button" className="border px-3" onClick={()=>setPhotoInputs(photoInputs.filter((_,j)=>j!==i))}>Remove</button>
            )}
          </div>
        ))}
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}
      <button disabled={loading} className="bg-black text-white px-4 py-2">
        {loading ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
