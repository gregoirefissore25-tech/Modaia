import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import SwipeCard from "../components/SwipeCard";
import type { SwipeAction } from "../components/SwipeCard";
import FilterSheet from "../components/FilterSheet";
import { IconArrowUp, IconFilter, IconHeart, IconSparkles, IconX } from "../components/icons";
import { fetchProducts, sendSwipe } from "../lib/api";
import { tapFeedback } from "../lib/haptics";
import type { Filters, Product } from "../lib/types";

const defaultFilters = (): Filters => {
  const raw = localStorage.getItem("modaia_filters");
  return raw ? JSON.parse(raw) : { gender: "women", categories: [], budget: 0 };
};

const VISIBLE_CARDS = 3;
const RELOAD_BELOW = 5;

// Position, echelle et opacite d'une carte selon sa profondeur dans la pile (ressort).
const DEPTH_SCALE = [1, 0.94, 0.9];
const DEPTH_Y = [0, -8, -16];
const DEPTH_OPACITY = [1, 0.7, 0.4];
const DEPTH_SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

export default function Explore() {
  const [stack, setStack] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [exiting, setExiting] = useState<SwipeAction | null>(null);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(false);
    try {
      setStack(await fetchProducts(f));
      setExiting(null); // pile remplacee : aucune sortie en cours
    } catch {
      setError(true);
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
    tapFeedback();
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
    <main className="relative flex flex-1 flex-col overflow-hidden px-3 pb-4 pt-5">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight">Explorer</h1>
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 text-sm uppercase tracking-wide text-smoke transition-colors duration-150 hover:text-ink"
        >
          <IconFilter className="h-4 w-4" />
          <span>Filtres{filters.categories.length > 0 && ` (${filters.categories.length})`}</span>
        </button>
      </header>

      <div className="relative flex-1">
        {stack.length > 0 ? (
          stack.slice(0, VISIBLE_CARDS).map((product, i) => {
            // Pendant la sortie de la carte du dessus, les suivantes avancent deja d'un cran.
            const depth = Math.min(exiting && i > 0 ? i - 1 : i, DEPTH_SCALE.length - 1);
            const isTop = i === 0;
            return (
              <motion.div
                key={product.id}
                className="absolute inset-0"
                style={{ zIndex: VISIBLE_CARDS - i }}
                animate={{ scale: DEPTH_SCALE[depth], y: DEPTH_Y[depth], opacity: DEPTH_OPACITY[depth] }}
                transition={DEPTH_SPRING}
              >
                <SwipeCard
                  product={product}
                  onSwipe={act}
                  interactive={isTop && !exiting}
                  exiting={isTop ? exiting : null}
                  onExited={handleExited}
                  showDetails={isTop}
                />
              </motion.div>
            );
          })
        ) : loading ? (
          <div className="skeleton absolute inset-0" />
        ) : error ? (
          <div className="flex h-full animate-fade-in-up flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-seam bg-white text-smoke">
              <IconX className="h-7 w-7" />
            </span>
            <p className="font-display text-xl">Connexion impossible</p>
            <p className="max-w-[26ch] text-sm text-smoke">
              Le feed n'a pas pu être chargé. Vérifie ta connexion puis réessaie.
            </p>
            <button
              onClick={() => load(filters)}
              className="mt-2 rounded-full bg-klein px-5 py-2.5 text-sm text-chalk transition-transform duration-150 active:scale-95"
            >
              Réessayer
            </button>
          </div>
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

      <div className="mt-5 flex items-center justify-center gap-8">
        <Action label="Passer" onClick={() => act("pass")} cls="border-seam text-smoke" icon={<IconX className="h-5 w-5" />} />
        <Action label="Garder" onClick={() => act("save")} cls="border-klein text-klein" icon={<IconHeart className="h-7 w-7" />} big />
        <Action label="J'aime" onClick={() => act("like")} cls="border-ink text-ink" icon={<IconArrowUp className="h-5 w-5" />} />
      </div>
      <p className="mt-3 text-center text-xs text-smoke">
        Liens affiliés · commission sans surcoût pour toi.
      </p>

      <AnimatePresence>
        {showFilters && (
          <FilterSheet filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
        )}
      </AnimatePresence>
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
      className={`flex items-center justify-center rounded-full border bg-white transition-transform duration-150 active:scale-90 ${cls} ${big ? "h-16 w-16" : "h-12 w-12"}`}
    >
      {icon}
    </button>
  );
}
