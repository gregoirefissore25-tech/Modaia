import { useEffect, useState } from "react";
import { fetchSaved, goUrl } from "../lib/api";
import type { Product } from "../lib/types";
import { price } from "../lib/types";

// Lookbook groupe par marchand : le "panier" V1.
// Pas de checkout unifie multi-marques : un bouton par marque, chaque lien
// passe par /api/go (tracking affilie). Voir CLAUDE.md tache C1 pour la V2 (Violet.io).
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
      <p className="mb-4 text-sm text-smoke">Tes coups de cœur, prêts à commander marque par marque.</p>

      {loading && <p className="text-smoke">Chargement…</p>}
      {!loading && items.length === 0 && (
        <p className="text-smoke">Rien pour l'instant. Swipe à droite dans Explorer pour remplir ton lookbook.</p>
      )}

      {Object.entries(byMerchant).map(([merchant, list]) => (
        <section key={merchant} className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">{merchant}</h2>
            <span className="text-sm text-smoke">
              {price(list.reduce((s, p) => s + p.price_cents, 0))}
            </span>
          </div>
          <ul className="mb-3 space-y-3">
            {list.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <img src={p.image_url} alt="" className="h-14 w-11 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-smoke">{p.brand}</p>
                </div>
                <span className="text-sm">{price(p.price_cents, p.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1.5">
            {list.map((p) => (
              <a
                key={p.id}
                href={goUrl(p.id)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg bg-klein py-2.5 text-center text-sm font-semibold text-chalk"
              >
                Commander chez {merchant} · {price(p.price_cents, p.currency)}
              </a>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
