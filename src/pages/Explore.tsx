import { useCallback, useEffect, useState } from "react";
import SwipeCard from "../components/SwipeCard";
import FilterSheet from "../components/FilterSheet";
import { fetchProducts, sendSwipe } from "../lib/api";
import type { Filters, Product } from "../lib/types";

const defaultFilters = (): Filters => {
  const raw = localStorage.getItem("modaia_filters");
  return raw ? JSON.parse(raw) : { gender: "women", categories: [], budget: 0 };
};

export default function Explore() {
  const [stack, setStack] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      setStack(await fetchProducts(f));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("modaia_filters", JSON.stringify(filters));
    load(filters);
  }, [filters, load]);

  const current = stack[0];

  const act = (action: "like" | "pass" | "save") => {
    if (!current) return;
    sendSwipe(current.id, action);
    const rest = stack.slice(1);
    setStack(rest);
    if (rest.length < 5) load(filters);
  };

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden p-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-2xl">Explorer</h1>
        <button
          onClick={() => setShowFilters(true)}
          className="rounded-full border border-seam px-4 py-1.5 text-sm"
        >
          Filtres{filters.categories.length > 0 && ` (${filters.categories.length})`}
        </button>
      </header>

      <div className="relative flex-1">
        {current ? (
          <SwipeCard key={current.id} product={current} onSwipe={act} />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-smoke">
            {loading ? "Chargement du vestiaire…" : "Plus rien à swiper avec ces filtres. Élargis-les pour continuer."}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <Action label="Passer" onClick={() => act("pass")} cls="border-seam text-smoke" symbol="✕" />
        <Action label="Garder" onClick={() => act("save")} cls="border-klein text-klein" symbol="♥" big />
        <Action label="J'aime" onClick={() => act("like")} cls="border-ink text-ink" symbol="↑" />
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

function Action({ label, onClick, cls, symbol, big }: {
  label: string; onClick: () => void; cls: string; symbol: string; big?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center rounded-full border-2 bg-white ${cls} ${big ? "h-16 w-16 text-2xl" : "h-12 w-12"}`}
    >
      {symbol}
    </button>
  );
}
