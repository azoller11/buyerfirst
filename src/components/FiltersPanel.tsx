"use client";

import { useMemo, useState } from "react";
import { listNiches, NICHE_DEFS, type NicheSlug, type FieldDef } from "@/niches/def";

type FiltersPanelProps = {
  defaults: {
    q?: string;
    niche?: string;
    status?: string;
    min?: string;
    max?: string;
    loc?: string;
    attrq?: string;
    view?: string;
    // Optional map of existing attr filters from the URL (see page.tsx change below)
    attr?: Record<string, string>;
  };
};

export default function FiltersPanel({ defaults }: FiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const niches = useMemo(() => listNiches(), []);
  const [selectedNiche, setSelectedNiche] = useState<string>(defaults.niche ?? "");

  const def = selectedNiche ? NICHE_DEFS[selectedNiche as NicheSlug] : undefined;

  function DynamicField({ f }: { f: FieldDef }) {
    const name = `attr_${f.key}`; // query param name (parsed on server)
    const dv = defaults.attr?.[f.key] ?? "";

    const baseProps = {
      name,
      defaultValue: dv,
      className: "border p-2 w-full rounded",
      placeholder: "placeholder" in f ? f.placeholder : undefined,
    };

    if (f.type === "select") {
      return (
        <div>
          <label className="block text-sm font-medium mb-1">{f.label}</label>
          <select {...baseProps}>
            <option value="">Any</option>
            {f.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (f.type === "number") {
      return (
        <div>
          <label className="block text-sm font-medium mb-1">{f.label}</label>
          <input type="number" {...baseProps} />
        </div>
      );
    }

    // text (default)
    return (
      <div>
        <label className="block text-sm font-medium mb-1">{f.label}</label>
        <input type="text" {...baseProps} />
      </div>
    );
  }

  const Form = (
    <form className="space-y-4">
      {/* Niche (drives dynamic section) */}
      <div>
        <label className="block text-sm font-medium mb-1">Niche</label>
        <select
          name="niche"
          defaultValue={defaults.niche ?? ""}
          onChange={(e) => setSelectedNiche(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="">Any</option>
          {niches.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      {/* Basic filters (always available) */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select name="status" defaultValue={defaults.status ?? ""} className="border p-2 w-full rounded">
          <option value="">Any</option>
          <option value="OPEN">Open</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="EXPIRED">Expired</option>
          <option value="OPEN,REVIEWING">Open or Reviewing</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Min budget</label>
          <input name="min" defaultValue={defaults.min ?? ""} type="number" className="border p-2 w-full rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max budget</label>
          <input name="max" defaultValue={defaults.max ?? ""} type="number" className="border p-2 w-full rounded" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location contains</label>
        <input name="loc" defaultValue={defaults.loc ?? ""} className="border p-2 w-full rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Attributes contain</label>
        <input
          name="attrq"
          defaultValue={defaults.attrq ?? ""}
          placeholder="e.g., author, set, pressing"
          className="border p-2 w-full rounded"
        />
      </div>

      {/* Dynamic niche-only filters */}
      {def && (
        <div className="pt-2 border-t">
          <div className="text-xs font-semibold text-gray-500 mb-2">
            Filters for <span className="uppercase">{def.name}</span>
          </div>
          <div className="space-y-3">
            {def.fields.map((f) => (
              <DynamicField key={f.key} f={f} />
            ))}
          </div>

          {/* Reset dynamic (client-side convenience) */}
          <button
            type="button"
            className="mt-2 text-xs underline text-gray-500"
            onClick={() => {
              const form = document.querySelector("form");
              if (!form) return;
              def.fields.forEach((f) => {
                const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="attr_${f.key}"]`);
                if (el) el.value = "";
              });
            }}
          >
            Reset niche filters
          </button>
        </div>
      )}

      {/* Preserve view; reset page */}
      <input type="hidden" name="view" value={defaults.view ?? "list"} />
      <input type="hidden" name="page" value="1" />

      <button className="w-full bg-blue-600 text-white py-2 rounded">Apply filters</button>
    </form>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border rounded px-3 py-2"
      >
        Filters
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[320px] sm:w-[380px] bg-white dark:bg-gray-900 shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setOpen(false)} className="p-2 rounded hover:bg-gray-100">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {Form}
          </div>
        </div>
      )}
    </>
  );
}
