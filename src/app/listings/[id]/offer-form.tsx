"use client";
import { useState } from "react";

export default function OfferForm({ listingId }: { listingId: string }) {
  const [price, setPrice] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        priceCents: price === "" ? null : Number(price) * 100,
        note,
      }),
    });
    setLoading(false);
    if (res.ok) setMsg("Offer submitted! The buyer will be notified.");
    else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || "Failed to submit offer");
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-2 border p-3">
      <div className="font-medium">Submit an offer to sell</div>
      <input
        className="border p-2 w-full"
        placeholder="Your price (USD)"
        type="number"
        value={price === "" ? "" : String(price)} 
        onChange={(e) =>
          setPrice(e.target.value ? Number(e.target.value) : "")
        }
        required
      />
      <textarea
        className="border p-2 w-full"
        placeholder="Notes (condition, shipping, timing)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button className="bg-black text-white px-4 py-2" disabled={loading}>
        {loading ? "Sending…" : "Send offer"}
      </button>
      {msg && <div className="text-sm mt-1">{msg}</div>}
    </form>
  );
}
