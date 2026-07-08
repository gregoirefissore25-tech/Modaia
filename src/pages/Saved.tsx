import { useEffect, useState } from "react";
import { fetchSaved, goUrl } from "../lib/api";
import { IconBookmark } from "../components/icons";
import type { Product } from "../lib/types";
import { price } from "../lib/types";

// Lookbook groupe par marchand : le "panier" V1.
// Pas de checkout unifie multi-marques : chaque produit garde son propre lien
// de tracking affilie via /api/go, donc une action de commande par produit.
// Voir CLAUDE.md tache C1 pour la V2 (Violet.io).

const SKELETON_ROWS = 3;

export default function Saved() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved().then(setItems).finally(() => setLoading(false));
  }, []);

  const byMerchant = items.reduce<Record<string, Product[]>>((acc, p) => {
    (acc[p.merchant] ||= []).push(p);
    return acc;
  }, {});

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <h1 className="mb-1 font-display text-2xl">Lookbook</h1>
      <p className="mb-5 text-sm text-smoke">Tes coups de cœur, prêts à commander marque par marque.</p>

      {loading && (
        <ul aria-hidden="true" className="space-y-4">
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="skeleton h-14 w-11 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-3.5 w-3/5 rounded" />
                <div className="skeleton h-3 w-2/5 rounded" />
              </div>
              <div className="skeleton h-8 w-24 shrink-0 rounded-full" />
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length === 0 && (
        <div className="flex animate-fade-in-up flex-col items-center px-6 pt-16 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blush/50 text-klein">
            <IconBookmark className="h-6 w-6" />
          </span>
          <h2 className="font-display text-xl">Ton lookbook t'attend</h2>
          <p className="mt-2 max-w-[28ch] text-sm text-smoke">
            Swipe à droite dans Explorer : chaque coup de cœur atterrit ici, prêt à commander.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="divide-y divide-seam">
          {Object.entries(byMerchant).map(([merchant, list]) => (
            <section key={merchant} className="animate-fade-in py-5 first:pt-0">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="min-w-0 truncate font-display text-lg">{merchant}</h2>
                <span className="shrink-0 text-sm text-smoke">
                  Total {price(list.reduce((s, p) => s + p.price_cents, 0))}
                </span>
              </div>
              <ul className="space-y-4">
                {list.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <img src={p.image_url} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="truncate text-xs text-smoke">
                        {p.brand} · {price(p.price_cents, p.currency)}
                      </p>
                    </div>
                    <a
                      href={goUrl(p.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-full bg-klein px-4 py-1.5 text-xs font-semibold text-chalk transition-transform duration-150 active:scale-95"
                    >
                      Commander
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
