import { useState } from "react";
import { price } from "../lib/types";

type Stats = {
  totals: { users: number; products: number; swipes: number; clicks: number; conversions: number; commission_cents: number };
  byMerchant: { name: string; clicks: number; conversions: number; commission_cents: number }[];
};

export default function Admin() {
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const r = await fetch(`/api/admin?token=${encodeURIComponent(token)}`);
    if (!r.ok) { setError("Token invalide"); return; }
    setStats(await r.json());
  };

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <h1 className="mb-4 font-display text-2xl">Admin</h1>
      {!stats && (
        <div className="flex gap-2">
          <input
            type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
            className="flex-1 rounded-lg border border-seam bg-white px-3 py-2"
          />
          <button onClick={load} className="rounded-lg bg-ink px-4 py-2 font-semibold text-chalk">Voir</button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {stats && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries({
              Utilisateurs: stats.totals.users, Produits: stats.totals.products,
              Swipes: stats.totals.swipes, Clics: stats.totals.clicks,
              Conversions: stats.totals.conversions
            }).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white p-3 text-center shadow-sm">
                <p className="font-display text-xl">{v}</p>
                <p className="text-xs text-smoke">{k}</p>
              </div>
            ))}
            <div className="rounded-xl bg-klein p-3 text-center text-chalk shadow-sm">
              <p className="font-display text-xl">{price(stats.totals.commission_cents)}</p>
              <p className="text-xs opacity-80">Commission</p>
            </div>
          </div>
          <table className="mt-4 w-full rounded-xl bg-white text-sm shadow-sm">
            <thead><tr className="text-left text-smoke">
              <th className="p-2">Marchand</th><th className="p-2">Clics</th><th className="p-2">Conv.</th><th className="p-2">Commission</th>
            </tr></thead>
            <tbody>
              {stats.byMerchant.map((m) => (
                <tr key={m.name} className="border-t border-seam">
                  <td className="p-2">{m.name}</td><td className="p-2">{m.clicks}</td>
                  <td className="p-2">{m.conversions}</td><td className="p-2">{price(m.commission_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
