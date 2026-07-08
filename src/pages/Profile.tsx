import { useState } from "react";
import { saveProfile } from "../lib/api";
import Toast from "../components/Toast";

const SIZE_LABELS = { top: "Haut", bottom: "Bas", shoes: "Chaussures" } as const;

export default function Profile() {
  const [sizes, setSizes] = useState(() =>
    JSON.parse(localStorage.getItem("modaia_sizes") || '{"top":"","bottom":"","shoes":""}')
  );
  const [toastVisible, setToastVisible] = useState(false);

  const save = async () => {
    localStorage.setItem("modaia_sizes", JSON.stringify(sizes));
    await saveProfile({ sizes });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <h1 className="mb-6 font-display text-2xl">Profil</h1>
      <section>
        <h2 className="font-display">Mes tailles</h2>
        <div className="mt-3 space-y-4 border-t border-seam pt-4">
          {(["top", "bottom", "shoes"] as const).map((k) => (
            <label key={k} className="block text-sm text-smoke">
              {SIZE_LABELS[k]}
              <input
                value={sizes[k]}
                onChange={(e) => setSizes({ ...sizes, [k]: e.target.value })}
                placeholder={k === "shoes" ? "39" : "M / 38"}
                className="mt-1.5 w-full rounded-lg border border-seam bg-white px-3 py-2 text-ink outline-none transition-colors duration-150 focus:border-klein focus:ring-1 focus:ring-klein"
              />
            </label>
          ))}
          <button
            onClick={save}
            className="w-full rounded-xl bg-ink py-2.5 font-semibold text-chalk transition-transform duration-150 active:scale-95"
          >
            Enregistrer
          </button>
        </div>
      </section>
      <p className="mt-8 text-center text-xs text-smoke">
        Modaia · les liens produits sont affiliés, la commission ne change pas ton prix. <a href="/confidentialite" className="underline">Confidentialité</a>
      </p>
      <Toast message="Tailles enregistrées" visible={toastVisible} />
    </main>
  );
}
