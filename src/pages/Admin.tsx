import { useState } from "react";
import { price, CATEGORIES, CATEGORY_LABELS } from "../lib/types";
import Select from "../components/Select";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";

type Stats = {
  totals: { users: number; products: number; swipes: number; clicks: number; conversions: number; commission_cents: number };
  byMerchant: { name: string; clicks: number; conversions: number; commission_cents: number }[];
};

const empty = {
  source: "", imageUrl: "", title: "", brand: "",
  priceEur: "", category: "dress", gender: "women"
};

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));
const GENDER_OPTIONS = [
  { value: "women", label: "Femme" },
  { value: "men", label: "Homme" }
];

const inputCls =
  "mt-1 w-full rounded-lg border border-seam bg-chalk px-3 py-2 text-ink outline-none transition-colors duration-150 focus:border-klein focus:ring-1 focus:ring-klein";

const TOAST_DURATION_MS = 2000;

export default function Admin() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  // Etat partage entre "Entrer" et "Rafraichir" (les deux appellent loadStats)
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const r = await fetch(`/.netlify/functions/admin?token=${encodeURIComponent(token)}`);
      if (!r.ok) { setError("Token invalide"); return; }
      setError("");
      setUnlocked(true);
      setStats(await r.json());
    } finally {
      setStatsLoading(false);
    }
  };

  const addProduct = async () => {
    setError("");
    setAdding(true);
    try {
      const r = await fetch("/.netlify/functions/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, product: form })
      });
      const d = await r.json();
      if (!r.ok) { setError("Erreur : " + (d.error || "inconnue")); return; }
      setAdded((a) => [form.title, ...a]);
      // garde categorie et genre pour enchainer plus vite
      setForm((f) => ({ ...empty, category: f.category, gender: f.gender }));
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), TOAST_DURATION_MS);
    } finally {
      setAdding(false);
    }
  };

  if (!unlocked)
    return (
      <main className="flex-1 overflow-y-auto p-4">
        <h1 className="mb-4 font-display text-2xl">Admin Modaia</h1>
        <div className="flex gap-2">
          <input
            type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
            className="flex-1 rounded-lg border border-seam bg-white px-3 py-2 outline-none transition-colors duration-150 focus:border-klein focus:ring-1 focus:ring-klein"
          />
          <button
            onClick={loadStats}
            disabled={statsLoading}
            className="relative rounded-lg bg-ink px-4 py-2 font-semibold text-chalk transition-transform duration-150 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* Libelle rendu invisible (pas retire) pour garder la largeur du bouton stable */}
            <span className={statsLoading ? "invisible" : undefined}>Entrer</span>
            {statsLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </span>
            )}
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm font-medium text-ink">{error}</p>}
      </main>
    );

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <h1 className="mb-4 font-display text-2xl">Admin Modaia</h1>

      <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-display text-lg">Importer un produit</h2>
        <p className="mb-4 mt-1 text-xs text-smoke">
          Colle le snippet SiteStripe (bouton Image) ou le lien affilié. Titre et prix se lisent sur la fiche Amazon.
        </p>
        <label className="mb-3 block text-sm text-smoke">
          Lien affilié ou snippet SiteStripe
          <textarea
            value={form.source} onChange={(e) => set("source", e.target.value)}
            rows={2} placeholder="Colle ici le lien SiteStripe ou le HTML de l'image"
            className={inputCls}
          />
        </label>
        <label className="mb-3 block text-sm text-smoke">
          URL image (optionnel si le snippet ci-dessus contient déjà l'image)
          <input
            value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="https://m.media-amazon.com/images/I/..."
            className={inputCls}
          />
        </label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="block text-sm text-smoke">
            Titre
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm text-smoke">
            Marque (optionnel)
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} />
          </label>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <label className="block text-sm text-smoke">
            Prix €
            <input value={form.priceEur} onChange={(e) => set("priceEur", e.target.value)}
              placeholder="29.99" inputMode="decimal" className={inputCls} />
          </label>
          <Select
            label="Catégorie"
            value={form.category}
            onChange={(v) => set("category", v)}
            options={CATEGORY_OPTIONS}
          />
          <Select
            label="Genre"
            value={form.gender}
            onChange={(v) => set("gender", v)}
            options={GENDER_OPTIONS}
          />
        </div>
        <button
          onClick={addProduct}
          disabled={adding}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-klein py-2.5 font-semibold text-chalk transition-transform duration-150 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {adding && <Spinner />}
          {adding ? "Ajout en cours..." : "Ajouter à Modaia"}
        </button>
        {error && <p role="alert" className="mt-2 text-sm font-medium text-ink">{error}</p>}
        {added.length > 0 && (
          <div className="mt-4 border-t border-seam pt-3 text-xs text-smoke">
            <p className="font-medium">{added.length} produit(s) ajouté(s) cette session :</p>
            <ul className="mt-1 list-disc pl-4">{added.slice(0, 8).map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Stats</h2>
          <button
            onClick={loadStats}
            disabled={statsLoading}
            className="relative text-sm font-medium text-klein transition-transform duration-150 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className={statsLoading ? "invisible" : undefined}>Rafraîchir</span>
            {statsLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </span>
            )}
          </button>
        </div>
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries({
              Utilisateurs: stats.totals.users, Produits: stats.totals.products,
              Swipes: stats.totals.swipes, Clics: stats.totals.clicks,
              Conversions: stats.totals.conversions
            }).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-chalk p-3 text-center">
                <p className="font-display text-2xl tabular-nums">{v}</p>
                <p className="mt-0.5 text-xs text-smoke">{k}</p>
              </div>
            ))}
            <div className="rounded-xl bg-klein p-3 text-center text-chalk">
              <p className="font-display text-2xl tabular-nums">{price(stats.totals.commission_cents)}</p>
              <p className="mt-0.5 text-xs opacity-80">Commission</p>
            </div>
          </div>
        )}
      </section>

      <Toast message="Produit ajouté" visible={toastVisible} />
    </main>
  );
}
