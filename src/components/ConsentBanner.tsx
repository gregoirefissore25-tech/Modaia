import { useState } from "react";

// R1 - RGPD : consentement au tracking des clics affilies.
export default function ConsentBanner() {
  const [choice, setChoice] = useState(() => localStorage.getItem("modaia_consent"));
  if (choice) return null;

  const decide = (v: "yes" | "no") => {
    localStorage.setItem("modaia_consent", v);
    setChoice(v);
  };

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md p-3">
      <div className="rounded-2xl bg-ink p-4 text-chalk shadow-xl">
        <p className="text-sm">
          Modaia mesure les clics vers les marchands pour toucher sa commission.
          Aucune revente de données. <a href="/confidentialite" className="underline">Détails</a>
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => decide("yes")} className="flex-1 rounded-lg bg-klein py-2 text-sm font-semibold">
            Accepter
          </button>
          <button onClick={() => decide("no")} className="flex-1 rounded-lg border border-chalk/30 py-2 text-sm">
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
