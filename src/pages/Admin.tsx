import { useState } from "react";
import { price, CATEGORIES, CATEGORY_LABELS } from "../lib/types";

type Stats = {
  totals: { users: number; products: number; swipes: number; clicks: number; conversions: number; commission_cents: number };
  byMerchant: { name: string; clicks: number; conversions: number; commission_cents: number }[];
};

const empty = {
  source: "", imageUrl: "", title: "", brand: "",
  priceEur: "", category: "dress", gender: "women"
};

export default function Admin() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [added, setAdded] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const loadStats = async () => {
    const r = await fetch(`/.netlify/functions/admin?token=${encodeURIComponent(token)}`);
    if (!r.ok) { setMsg("Token invalide"); return; }
    setUnlocked(true);
    setStats(await r.json());
  };

  const addProduct = async () => {
    setMsg("");
    const r = await fetch("/.netlify/functions/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, product: form })
    });
    const d = await r.json();
    if (!r.ok) { setMsg("Erreur : " + (d.error || "inconnue")); return; }
    setAdded((a) => [form.title, ...a]);
    // garde categorie et genre pour enchainer plus vite
    setForm((f) => ({ ...empty, category: f.category, gender: f.gender }));
    setMsg("Ajouté ✓");
  };

  if (!unlocked)
    return (
      <main className="flex-1 overflow-y-auto p-4">
        <h1 className="mb-4 font-display text-2xl">Admin Modaia</h1>
        <div className="flex gap-2">
          <input
            type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
            className="flex-1 rounded-lg border border-seam bg-white px-3 py-2"
          />
          <button onClick={loadStats} className="rounded-lg bg-ink px-4 py-2 font-semibold text-chalk">Entrer</button>
        </div>
        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
      </main>
    );

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <h1 className="mb-4 font-display text-2xl">Admin Modaia</h1>

      <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 font-display text-lg">Importer un produit</h2>
        <p className="mb-3 text-xs text-smoke">
          Colle le snippet SiteStripe (bouton Image) ou le lien affilié. Titre et prix se lisent sur la fiche Amazon.
        </p>
        <label className="mb-2 block text-sm text-smoke">
          Lien affilié ou snippet SiteStripe
          <textarea
            value={form.source} onChange={(e) => set("source", e.target.value)}
            rows={2} placeholder="Colle ici le lien SiteStripe ou le HTML de l'image"
            className="mt-1 w-full rounded-lg border border-seam bg-chalk px-3 py-2 text-ink"
          />
        </label>
        <label className="mb-2 block text-sm text-smoke">
          URL image (optionnel si le snippet ci-dessus contient déjà l'image)
          <input
            value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="https://m.media-amazon.com/images/I/..."
            className="mt-1 w-full rounded-lg border border-seam bg-chalk px-3 py-2 text-ink"
          />
        </label>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <label className="block text-sm text-smoke">
            Titre
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              className="mt-1 w-full rounded-lg border border-seam bg-chalk px-3 py-2 text-ink" />
          </label>
          <label className="block text-sm text-smoke">
            Marque (optionnel)
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)}
              className="mt-1 w-full rounded-lg border border-seam bg-chalk px-3 py-2 text-ink" />
          </label>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <label className="block text-sm text-smoke">
            Prix €
            <input value={form.priceEur} onChange={(e) => set("priceEur", e.target.value)}
              placeholder="29.99" inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-seam bg-chalk px-3 py-2 text-ink" />
          </label>
          <label className="block text-sm text-smoke">
            Catégorie
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className="mt-1 w-full rounded-lg border border-seam bg-chalk px-2 py-2 text-ink">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </label>
          <label className="block text-sm text-smoke">
            Genre
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
              className="mt-1 w-full rounded-lg border border-seam bg-chalk px-2 py-2 text-ink">
              <option value="women">Femme</option>
              <option value="men">Homme</option>
            </select>
          </label>
        </div>
        <button onClick={addProduct} className="w-full rounded-lg bg-klein py-2.5 font-semibold text-chalk">
          Ajouter à Modaia
        </button>
        {msg && <p className="mt-2 text-sm text-ink">{msg}</p>}
        {added.length > 0 && (
          <div className="mt-3 text-xs text-smoke">
            <p className="font-medium">{added.length} produit(s) ajouté(s) cette session :</p>
            <ul className="mt-1 list-disc pl-4">{added.slice(0, 8).map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Stats</h2>
          <button onClick={loadStats} className="text-sm text-klein">Rafraîchir</button>
        </div>
        {stats && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries({
                Utilisateurs: stats.totals.users, Produits: stats.totals.products,
                Swipes: stats.totals.swipes, Clics: stats.totals.clicks,
                Conversions: stats.totals.conversions
              }).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-chalk p-3 text-center">
                  <p className="font-display text-xl">{v}</p>
                  <p className="text-xs text-smoke">{k}</p>
                </div>
              ))}
              <div className="rounded-xl bg-klein p-3 text-center text-chalk">
                <p className="font-display text-xl">{price(stats.totals.commission_cents)}</p>
                <p className="text-xs opacity-80">Commission</p>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
