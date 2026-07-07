import { useState } from "react";
import { saveProfile } from "../lib/api";

export default function Profile() {
  const [sizes, setSizes] = useState(() =>
    JSON.parse(localStorage.getItem("modaia_sizes") || '{"top":"","bottom":"","shoes":""}')
  );
  const [saved, setSaved] = useState(false);

  const save = async () => {
    localStorage.setItem("modaia_sizes", JSON.stringify(sizes));
    await saveProfile({ sizes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <h1 className="mb-4 font-display text-2xl">Profil</h1>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-display">Mes tailles</h2>
        {(["top", "bottom", "shoes"] as const).map((k) => (
          <label key={k} className="mb-3 block text-sm text-smoke">
            {k === "top" ? "Haut" : k === "bottom" ? "Bas" : "Chaussures"}
            <input
              value={sizes[k]}
              onChange={(e) => setSizes({ ...sizes, [k]: e.target.value })}
              placeholder={k === "shoes" ? "39" : "M / 38"}
              className="mt-1 w-full rounded-lg border border-seam bg-chalk px-3 py-2 text-ink"
            />
          </label>
        ))}
        <button onClick={save} className="mt-1 w-full rounded-lg bg-ink py-2.5 font-semibold text-chalk">
          {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </section>
      <p className="mt-6 text-center text-xs text-smoke">
        Modaia · les liens produits sont affiliés, la commission ne change pas ton prix. <a href="/confidentialite" className="underline">Confidentialité</a>
      </p>
    </main>
  );
}
