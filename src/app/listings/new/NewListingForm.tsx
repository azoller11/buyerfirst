"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { NICHE_DEFS, type NicheSlug, type FieldDef, listNiches } from "@/niches/def";

export default function NewListingForm() {
  const r = useRouter();

  // Standard fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [photoInputs, setPhotoInputs] = useState<string[]>([""]);

  // Niche selection + dynamic attributes
  const [nicheSlug, setNicheSlug] = useState<NicheSlug | "">("");
  const [attrs, setAttrs] = useState<Record<string, string>>({});

  // UI state
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

    if (!nicheSlug || !def) {
      setErr("Please choose a niche.");
      return;
    }

    // Basic client-side required checks
    for (const f of def.fields) {
      if ('required' in f && f.required && !String(attrs[f.key] ?? "").trim()) {
        setErr(`Please fill "${f.label}".`);
        return;
      }
    }

    setLoading(true);

    // Build attributes payload from current def
    const attributes = Object.fromEntries(
      (def.fields ?? []).map(f => [f.key, attrs[f.key] ?? ""])
    );

    let res: Response | undefined;
    try {
      res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nicheSlug,
          attributes,
          title,
          description,
          location: location || null,
          budgetMin: budgetMin ? Number(budgetMin) : null,
          budgetMax: budgetMax ? Number(budgetMax) : null,
          photos: photoInputs.filter(Boolean),
        }),
      });
    } catch (e) {
      console.error("Network error submitting listing:", e);
      setErr("Network error. Check your connection and try again.");
      setLoading(false);
      return;
    }

    setLoading(false);

    if (!res.ok) {
      let msg = "Failed to create listing";
      try {
        const data = await res.json();
        console.error("Create listing failed:", data);
        // Prefer precise messages from server (our POST route returns these)
        if (data?.error) msg = data.error;
        if (data?.trace?.step) msg += ` (at: ${data.trace.step})`;
        // Show Zod field errors if present
        if (data?.details?.fieldErrors) {
          const firstField = Object.keys(data.details.fieldErrors)[0];
          const firstMsg = data.details.fieldErrors[firstField]?.[0];
          if (firstMsg) msg = firstMsg;
        }
      } catch {
        // ignore parse error, keep default msg
      }

      if (res.status === 401) {
        window.location.href = "/signin?callbackUrl=/listings/new";
        return;
      }
      setErr(msg);
      return;
    }

    const listing = await res.json();
    r.push(`/listings/${listing.id}`);
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Post a Buyer Listing (WTB)</h1>

      <form onSubmit={submit} className="mt-4 space-y-4">
        {/* Niche selector */}
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
            required
          >
            <option value="">Choose a niche…</option>
            {niches.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        {/* Standard fields */}
        <input
          className="border p-2 w-full"
          placeholder="Item name / title"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          required
        />

        <textarea
          className="border p-2 w-full"
          rows={5}
          placeholder="Describe condition, specs, must-haves, timing…"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          required
        />

        <div className="flex gap-2">
          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Budget min (optional)"
            value={budgetMin}
            onChange={(e)=>setBudgetMin(e.target.value)}
          />
          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Budget max (optional)"
            value={budgetMax}
            onChange={(e)=>setBudgetMax(e.target.value)}
          />
        </div>

        <input
          className="border p-2 w-full"
          placeholder="Location (optional)"
          value={location}
          onChange={(e)=>setLocation(e.target.value)}
        />

        {/* Photos */}
        <div className="space-y-2">
          <div className="font-medium">Photo URLs</div>
          {photoInputs.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="border p-2 w-full"
                placeholder="https://…"
                value={p}
                onChange={(e)=>setPhotoAt(i, e.target.value)}
              />
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

        {/* Dynamic niche-specific fields */}
        {def && (
          <div className="space-y-2">
            <div className="font-medium">Details for {def.name}</div>
            {def.fields.map((f: FieldDef) => {
              const commonProps = {
                id: f.key,
                required: Boolean(f.required),
                placeholder: f.placeholder,
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
          {loading ? "Creating…" : "Create"}
        </button>
      </form>
    </main>
  );
}
