import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProfile } from "../lib/api";

// Onboarding sans friction : 12 swipes de looks (infere le style_vector),
// puis budget. Trois ecrans max avant le premier feed. Pas de formulaire de style.
const LOOKS = [
  { tag: "casual", img: "https://picsum.photos/seed/look1/600/800", label: "Casual du quotidien" },
  { tag: "chic", img: "https://picsum.photos/seed/look2/600/800", label: "Chic minimal" },
  { tag: "street", img: "https://picsum.photos/seed/look3/600/800", label: "Streetwear" },
  { tag: "boheme", img: "https://picsum.photos/seed/look4/600/800", label: "Bohème" },
  { tag: "sport", img: "https://picsum.photos/seed/look5/600/800", label: "Athleisure" },
  { tag: "casual", img: "https://picsum.photos/seed/look6/600/800", label: "Denim brut" },
  { tag: "chic", img: "https://picsum.photos/seed/look7/600/800", label: "Tailoring" },
  { tag: "street", img: "https://picsum.photos/seed/look8/600/800", label: "Oversize" },
  { tag: "boheme", img: "https://picsum.photos/seed/look9/600/800", label: "Imprimés fleuris" },
  { tag: "chic", img: "https://picsum.photos/seed/look10/600/800", label: "Monochrome" },
  { tag: "sport", img: "https://picsum.photos/seed/look11/600/800", label: "Techwear léger" },
  { tag: "casual", img: "https://picsum.photos/seed/look12/600/800", label: "Lin d'été" }
];

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [idx, setIdx] = useState(0);
  const [vector, setVector] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState(10000);

  const vote = (liked: boolean) => {
    const tag = LOOKS[idx].tag;
    if (liked) setVector((v) => ({ ...v, [tag]: (v[tag] || 0) + 1 }));
    if (idx + 1 >= LOOKS.length) setStep(2);
    else setIdx(idx + 1);
  };

  const finish = async () => {
    localStorage.setItem("modaia_onboarded", "1");
    await saveProfile({ budgetMaxCents: budget, styleVector: vector });
    nav("/explore");
  };

  if (step === 0)
    return (
      <main className="flex flex-1 flex-col justify-center p-8">
        <p className="mb-2 font-display text-xl text-klein">Modaia</p>
        <h1 className="font-display text-4xl leading-tight">
          Ton style,<br /><span className="text-klein">en un swipe.</span>
        </h1>
        <p className="mt-4 text-smoke">
          12 looks pour cerner ton style. Ensuite, on te propose uniquement ce qui te ressemble.
        </p>
        <button
          onClick={() => setStep(1)}
          className="mt-8 rounded-xl bg-ink py-3.5 font-semibold text-chalk"
        >
          C'est parti
        </button>
      </main>
    );

  if (step === 1) {
    const look = LOOKS[idx];
    return (
      <main className="flex flex-1 flex-col p-4">
        <p className="mb-2 text-center text-sm text-smoke">{idx + 1} / {LOOKS.length}</p>
        <div className="relative flex-1 overflow-hidden rounded-2xl">
          <img src={look.img} alt={look.label} className="h-full w-full object-cover" />
          <p className="absolute bottom-4 left-4 rounded bg-ink/70 px-3 py-1 font-display text-chalk">
            {look.label}
          </p>
        </div>
        <div className="mt-4 flex justify-center gap-6">
          <button onClick={() => vote(false)} className="h-14 w-14 rounded-full border-2 border-seam bg-white text-xl text-smoke">✕</button>
          <button onClick={() => vote(true)} className="h-14 w-14 rounded-full border-2 border-klein bg-white text-xl text-klein">♥</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col justify-center p-8">
      <h2 className="font-display text-3xl">Ton budget par pièce ?</h2>
      <p className="mt-6 font-display text-5xl text-klein">
        {budget >= 30000 ? "Illimité" : `${budget / 100} €`}
      </p>
      <input
        type="range" min={2000} max={30000} step={1000}
        value={budget} onChange={(e) => setBudget(Number(e.target.value))}
        className="mt-6 w-full accent-klein"
      />
      <button onClick={finish} className="mt-10 rounded-xl bg-klein py-3.5 font-semibold text-chalk">
        Voir ma sélection
      </button>
    </main>
  );
}
