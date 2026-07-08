import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Filters } from "../lib/types";
import { CATEGORIES, CATEGORY_LABELS } from "../lib/types";
import { IconCheck } from "./icons";

type Props = {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
};

const BUDGET_MAX_CENTS = 30000;
// Duree de la transition de sortie ; le vrai onClose (demontage par le parent)
// est appele apres ce delai, meme pattern que SwipeCard.
const CLOSE_DURATION_MS = 200;

export default function FilterSheet({ filters, onChange, onClose }: Props) {
  const [closing, setClosing] = useState(false);

  // Le demontage est cale sur la duree de la transition (setTimeout, robuste
  // meme si prefers-reduced-motion coupe la transition).
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(onClose, CLOSE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [closing, onClose]);

  // Fermeture animee a la touche Echap.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClosing(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const requestClose = () => setClosing(true);

  const toggle = (cat: string) => {
    const has = filters.categories.includes(cat);
    onChange({
      ...filters,
      categories: has
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat]
    });
  };

  // Remplissage du track jusqu'a la valeur, lu par .range-klein via --range-fill
  const fillPct = (filters.budget / BUDGET_MAX_CENTS) * 100;

  return (
    <div
      className={
        "fixed inset-0 z-20 flex items-end bg-ink/40 " +
        (closing
          ? "pointer-events-none opacity-0 transition-opacity duration-200 ease-out"
          : "animate-fade-in")
      }
      onClick={requestClose}
    >
      <div
        className={
          "w-full rounded-t-2xl bg-chalk p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] " +
          (closing
            ? "translate-y-full transition-transform duration-200 ease-out"
            : "animate-slide-up")
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            className="text-sm text-smoke transition-transform duration-150 active:scale-95"
            onClick={() => onChange({ ...filters, categories: [] })}
          >
            Effacer
          </button>
          <p className="font-display">Filtres ({filters.categories.length})</p>
          <button
            className="text-sm font-semibold text-klein transition-transform duration-150 active:scale-95"
            onClick={requestClose}
          >
            Enregistrer
          </button>
        </div>
        <div className="mb-4 flex gap-2">
          {(["women", "men"] as const).map((g) => (
            <button
              key={g}
              onClick={() => onChange({ ...filters, gender: g })}
              className={
                "rounded-full border px-4 py-1.5 text-sm transition duration-150 active:scale-95 " +
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
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 " +
                (filters.categories.includes(c) ? "bg-white font-medium text-klein" : "text-ink")
              }
            >
              {CATEGORY_LABELS[c]}
              {filters.categories.includes(c) && <IconCheck className="h-4 w-4" />}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm text-smoke">
          Budget max : {filters.budget === 0 ? "illimité" : `${filters.budget / 100} €`}
          <input
            type="range"
            min={0}
            max={BUDGET_MAX_CENTS}
            step={1000}
            value={filters.budget}
            onChange={(e) => onChange({ ...filters, budget: Number(e.target.value) })}
            className="range-klein mt-1 w-full"
            style={{ "--range-fill": `${fillPct}%` } as CSSProperties}
          />
        </label>
      </div>
    </div>
  );
}
