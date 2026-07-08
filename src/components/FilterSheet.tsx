import { useEffect } from "react";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import type { PanInfo } from "motion/react";
import type { Filters } from "../lib/types";
import { CATEGORIES, CATEGORY_LABELS } from "../lib/types";
import { IconCheck } from "./icons";

type Props = {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
};

const BUDGET_MAX_CENTS = 30000;
const DISMISS_DISTANCE_PX = 120;
const DISMISS_VELOCITY_PX_S = 600;

export default function FilterSheet({ filters, onChange, onClose }: Props) {
  // Fermeture a la touche Echap.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggle = (cat: string) => {
    const has = filters.categories.includes(cat);
    onChange({
      ...filters,
      categories: has
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat]
    });
  };

  // Glisser la feuille vers le bas pour la fermer (comme un bottom sheet iOS/Android),
  // en plus du clic exterieur/Echap/Enregistrer. Le parent doit envelopper ce composant
  // dans <AnimatePresence> pour que exit/initial jouent au montage/demontage.
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE_PX || info.velocity.y > DISMISS_VELOCITY_PX_S) onClose();
  };

  // Remplissage du track jusqu'a la valeur, lu par .range-klein via --range-fill
  const fillPct = (filters.budget / BUDGET_MAX_CENTS) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-end bg-ink/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.div
        className="w-full rounded-t-2xl bg-chalk p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.55 }}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignee : affordance visuelle standard des bottom sheets, indique que la
            feuille se glisse vers le bas pour se fermer. */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-seam" />
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
            onClick={onClose}
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
      </motion.div>
    </motion.div>
  );
}
