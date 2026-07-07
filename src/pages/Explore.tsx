import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import SwipeCard from "../components/SwipeCard";
import type { SwipeAction } from "../components/SwipeCard";
import FilterSheet from "../components/FilterSheet";
import { IconArrowUp, IconFilter, IconHeart, IconSparkles, IconX } from "../components/icons";
import { fetchProducts, sendSwipe } from "../lib/api";
import type { Filters, Product } from "../lib/types";

const defaultFilters = (): Filters => {
  const raw = localStorage.getItem("modaia_filters");
  return raw ? JSON.parse(raw) : { gender: "women", categories: [], budget: 0 };
};

const VISIBLE_CARDS = 3;
const RELOAD_BELOW = 5;

// Position, echelle et opacite d'une carte selon sa profondeur dans la pile.
const DEPTH_CLASSES = [
  "translate-y-0 scale-100 opacity-100",
  "-translate-y-2 scale-[0.94] opacity-70",
  "-translate-y-4 scale-[0.90] opacity-40"
] as const;

export default function Explore() {
  const [stack, setStack] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState<SwipeAction | null>(null);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      setStack(await fetchProducts(f));
      setExiting(null); // pile remplacee : aucune sortie en cours
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("modaia_filters", JSON.stringify(filters));
    load(filters);
  }, [filters, load]);

  const current = stack[0];

  // Declenche l'animation de sortie ; le retrait de la pile attend onExited.
  const act = (action: SwipeAction) => {
    if (!current || exiting) return;
    sendSwipe(current.id, action);
    setExiting(action);
  };

  const handleExited = useCallback(() => {
    const rest = stack.slice(1);
    setExiting(null);
    setStack(rest);
    if (rest.length < RELOAD_BELOW) load(filters);
  }, [stack, filters, load]);

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden p-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-2xl">Explorer</h1>
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 rounded-full border border-seam px-4 py-1.5 text-sm"
        >
          <IconFilter className="h-4 w-4" />
          <span>Filtres{filters.categories.length > 0 && ` (${filters.categories.length})`}</span>
        </button>
      </header>

      <div className="relative flex-1">
        {stack.length > 0 ? (
          stack.slice(0, VISIBLE_CARDS).map((product, i) => {
            // Pendant la sortie de la carte du dessus, les suivantes avancent deja d'un cran.
            const depth = exiting && i > 0 ? i - 1 : i;
            const isTop = i === 0;
            return (
              <div
                key={product.id}
                className={`absolute inset-0 transition-[transform,opacity] duration-300 ease-out ${
                  DEPTH_CLASSES[Math.min(depth, DEPTH_CLASSES.length - 1)]
                }`}
                style={{ zIndex: VISIBLE_CARDS - i }}
              >
                <SwipeCard
                  product={product}
                  onSwipe={act}
                  interactive={isTop && !exiting}
                  exiting={isTop ? exiting : null}
                  onExited={handleExited}
                />
              </div>
            );
          })
        ) : loading ? (
          <div className="skeleton absolute inset-0" />
        ) : (
          <div className="flex h-full animate-fade-in-up flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blush/40 text-ink">
              <IconSparkles className="h-7 w-7" />
            </span>
            <p className="font-display text-xl">Tu as tout vu</p>
            <p className="max-w-[26ch] text-sm text-smoke">
              Élargis tes filtres pour découvrir de nouvelles pièces.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="mt-2 rounded-full bg-klein px-5 py-2.5 text-sm text-chalk transition-transform duration-150 active:scale-95"
            >
              Élargir les filtres
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <Action label="Passer" onClick={() => act("pass")} cls="border-seam text-smoke" icon={<IconX className="h-5 w-5" />} />
        <Action label="Garder" onClick={() => act("save")} cls="border-klein text-klein" icon={<IconHeart className="h-7 w-7" />} big />
        <Action label="J'aime" onClick={() => act("like")} cls="border-ink text-ink" icon={<IconArrowUp className="h-5 w-5" />} />
      </div>
      <p className="mt-3 text-center text-[10px] text-smoke">
        Modaia touche une commission sur les achats effectués via ses liens.
      </p>

      {showFilters && (
        <FilterSheet filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
      )}
    </main>
  );
}

function Action({ label, onClick, cls, icon, big }: {
  label: string; onClick: () => void; cls: string; icon: ReactNode; big?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center rounded-full border-2 bg-white transition-transform duration-150 active:scale-90 ${cls} ${big ? "h-16 w-16" : "h-12 w-12"}`}
    >
      {icon}
    </button>
  );
}
