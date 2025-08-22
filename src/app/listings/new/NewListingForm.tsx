"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewListingForm() {
  const r = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState<number | "">("");
  const [budgetMax, setBudgetMax] = useState<number | "">("");
  const [photoInputs, setPhotoInputs] = useState<string[]>([""]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setPhotoAt = (i: number, v: string) => {
    const next = photoInputs.slice();
    next[i] = v;
    setPhotoInputs(next);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ← ensure session cookie is sent
        body: JSON.stringify({
            title,
            description,
            location: location || null,
            budgetMin: budgetMin === "" ? null : Number(budgetMin),
            budgetMax: budgetMax === "" ? null : Number(budgetMax),
            photos: photoInputs.filter(Boolean),
        }),
        });

        setLoading(false);

        if (!res.ok) {
        let msg = "Failed to create listing";
        try {
            const data = await res.json();
            if (data?.error) msg = data.error;
        } catch {
            // ignore
        }
        // If 401, bounce to sign-in (session missing)
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
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="border p-2 w-full" placeholder="Item name / title"
               value={title} onChange={e=>setTitle(e.target.value)} required />
        <textarea className="border p-2 w-full" rows={5}
                  placeholder="Describe condition, specs, must-haves, timing…"
                  value={description} onChange={e=>setDescription(e.target.value)} required />
        <div className="flex gap-2">
          <input className="border p-2 w-full" type="number" placeholder="Budget min (optional)"
                 value={budgetMin === "" ? "" : String(budgetMin)}
                 onChange={(e)=>setBudgetMin(e.target.value ? Number(e.target.value) : "")} />
          <input className="border p-2 w-full" type="number" placeholder="Budget max (optional)"
                 value={budgetMax === "" ? "" : String(budgetMax)}
                 onChange={(e)=>setBudgetMax(e.target.value ? Number(e.target.value) : "")} />
        </div>
        <input className="border p-2 w-full" placeholder="Location (optional)"
               value={location} onChange={e=>setLocation(e.target.value)} />

        <div className="space-y-2">
          <div className="font-medium">Photo URLs (MVP)</div>
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

        {err && <div className="text-sm text-red-600">{err}</div>}
        <button disabled={loading} className="bg-black text-white px-4 py-2">
          {loading ? "Creating…" : "Create"}
        </button>
      </form>
    </main>
  );
}
