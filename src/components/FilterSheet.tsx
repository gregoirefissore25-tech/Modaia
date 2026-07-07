import type { Filters } from "../lib/types";
import { CATEGORIES, CATEGORY_LABELS } from "../lib/types";

type Props = {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
};

export default function FilterSheet({ filters, onChange, onClose }: Props) {
  const toggle = (cat: string) => {
    const has = filters.categories.includes(cat);
    onChange({
      ...filters,
      categories: has
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat]
    });
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-ink/40" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-chalk p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <button className="text-sm text-smoke" onClick={() => onChange({ ...filters, categories: [] })}>
            Effacer
          </button>
          <p className="font-display">Filtres ({filters.categories.length})</p>
          <button className="text-sm font-semibold text-klein" onClick={onClose}>
            Enregistrer
          </button>
        </div>
        <div className="mb-4 flex gap-2">
          {(["women", "men"] as const).map((g) => (
            <button
              key={g}
              onClick={() => onChange({ ...filters, gender: g })}
              className={
                "rounded-full border px-4 py-1.5 text-sm " +
                (filters.gender === g ? "border-klein bg-klein text-chalk" : "border-seam text-smoke")
              }
            >
              {g === "women" ? "Femme" : "Homme"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm " +
                (filters.categories.includes(c) ? "bg-white font-medium text-klein" : "text-ink")
              }
            >
              {CATEGORY_LABELS[c]}
              {filters.categories.includes(c) && <span>✓</span>}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm text-smoke">
          Budget max : {filters.budget === 0 ? "illimité" : `${filters.budget / 100} €`}
          <input
            type="range"
            min={0}
            max={30000}
            step={1000}
            value={filters.budget}
            onChange={(e) => onChange({ ...filters, budget: Number(e.target.value) })}
            className="mt-1 w-full accent-klein"
          />
        </label>
      </div>
    </div>
  );
}
