import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { saveProfile } from "../lib/api";
import { tapFeedback } from "../lib/haptics";
import { IconHeart, IconX } from "../components/icons";
import { Badge } from "../components/SwipeCard";
import Spinner from "../components/Spinner";

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

const SWIPE_THRESHOLD_PX = 90;
const BADGE_THRESHOLD_PX = 40;
const EXIT_DURATION_MS = 220;

const BUDGET_MIN_CENTS = 2000;
const BUDGET_MAX_CENTS = 30000;
const BUDGET_STEP_CENTS = 1000;

// Photo de look avec skeleton le temps du chargement puis fondu.
// L'etat loaded est reinitialise par le remount existant (key={idx} sur le bloc parent).
function LookImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <div className="skeleton absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

// Barre de progression en segments fins, style "stories" :
// segments votes + courant en klein, segments a venir en seam.
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Look ${current + 1} sur ${total}`}
      className="mb-3 flex gap-1"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full ${i <= current ? "bg-klein" : "bg-seam"}`}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [idx, setIdx] = useState(0);
  const [vector, setVector] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState(10000);
  const [finishing, setFinishing] = useState<boolean>(false);

  // Drag au doigt, meme mecanique que SwipeCard (feed principal) : relache sous le
  // seuil = snap-back anime, au-dela = decision + sortie animee avant de passer au look suivant.
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<"like" | "pass" | null>(null);
  const startX = useRef<number | null>(null);

  // Avance au look suivant (ou a l'ecran budget si c'etait le dernier), une fois la
  // sortie animee terminee.
  const advance = useCallback(() => {
    setExiting(null);
    setDx(0);
    setIdx((i) => {
      if (i + 1 >= LOOKS.length) {
        setStep(2);
        return i;
      }
      return i + 1;
    });
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const timer = setTimeout(advance, EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [exiting, advance]);

  const vote = (liked: boolean) => {
    if (exiting) return;
    tapFeedback();
    const tag = LOOKS[idx].tag;
    if (liked) setVector((v) => ({ ...v, [tag]: (v[tag] || 0) + 1 }));
    setExiting(liked ? "like" : "pass");
  };

  const onDown = (e: React.PointerEvent) => {
    if (exiting) return;
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (startX.current === null || exiting) return;
    setDx(e.clientX - startX.current);
  };
  const onUp = () => {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      vote(dx > 0);
      return;
    }
    setDx(0);
  };

  const finish = async () => {
    localStorage.setItem("modaia_onboarded", "1");
    setFinishing(true);
    try {
      await saveProfile({ budgetMaxCents: budget, styleVector: vector });
    } finally {
      setFinishing(false);
    }
    nav("/explore");
  };

  if (step === 0)
    return (
      <main className="flex flex-1 flex-col justify-center p-8">
        <div className="flex flex-col animate-fade-in-up">
          <p className="mb-2 font-display text-xl text-klein">Modaia</p>
          <h1 className="font-display text-4xl leading-tight">
            Ton style,<br /><span className="text-klein">en un swipe.</span>
          </h1>
          <p className="mt-4 text-smoke">
            12 looks pour cerner ton style. Ensuite, on te propose uniquement ce qui te ressemble.
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-8 rounded-xl bg-ink py-3.5 font-semibold text-chalk transition-transform duration-150 active:scale-95"
          >
            C'est parti
          </button>
        </div>
      </main>
    );

  if (step === 1) {
    const look = LOOKS[idx];
    const transform = exiting
      ? exiting === "like"
        ? "translateX(120%) rotate(12deg)"
        : "translateX(-120%) rotate(-12deg)"
      : `translateX(${dx}px) rotate(${dx / 25}deg)`;
    return (
      <main className="flex flex-1 flex-col p-4">
        <ProgressBar current={idx} total={LOOKS.length} />
        {/* Cle sur idx : remonte le bloc a chaque look pour rejouer l'entree.
            L'entree (animate-fade-in-up) est sur ce wrapper, separee de la carte
            interne qui porte le transform de drag : les deux se marchent dessus
            sinon (l'animation garde la main sur transform apres coup, cf both). */}
        <div key={idx} className="relative flex-1 animate-fade-in-up">
          <div
            className={`relative h-full w-full touch-none select-none overflow-hidden rounded-2xl ${
              dragging ? "" : "transition-[transform,opacity] duration-200 ease-out"
            }`}
            style={{ transform, opacity: exiting ? 0 : 1 }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <LookImage src={look.img} alt={look.label} />
            <p className="absolute bottom-4 left-4 rounded bg-ink/70 px-3 py-1 font-display text-chalk">
              {look.label}
            </p>
            {(dx > BADGE_THRESHOLD_PX || exiting === "like") && (
              <Badge text="J'aime" icon={<IconHeart className="h-4 w-4" />} cls="left-4 bg-klein" />
            )}
            {(dx < -BADGE_THRESHOLD_PX || exiting === "pass") && (
              <Badge text="Passe" icon={<IconX className="h-4 w-4" />} cls="right-4 bg-ink" />
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-6">
          <button
            onClick={() => vote(false)}
            aria-label="Passer ce look"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-seam bg-white text-smoke transition-transform duration-150 active:scale-90"
          >
            <IconX className="h-6 w-6" />
          </button>
          <button
            onClick={() => vote(true)}
            aria-label="J'aime ce look"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-klein bg-white text-klein transition-transform duration-150 active:scale-90"
          >
            <IconHeart className="h-6 w-6" />
          </button>
        </div>
      </main>
    );
  }

  // Remplissage du track jusqu'a la valeur, lu par .range-klein via --range-fill
  const fillPct = ((budget - BUDGET_MIN_CENTS) / (BUDGET_MAX_CENTS - BUDGET_MIN_CENTS)) * 100;

  return (
    <main className="flex flex-1 flex-col justify-center p-8 animate-fade-in-up">
      <h2 className="font-display text-3xl">Ton budget par pièce ?</h2>
      <p className="mt-6 font-display text-5xl text-klein">
        {budget >= BUDGET_MAX_CENTS ? "Illimité" : `${budget / 100} €`}
      </p>
      <input
        type="range" min={BUDGET_MIN_CENTS} max={BUDGET_MAX_CENTS} step={BUDGET_STEP_CENTS}
        value={budget} onChange={(e) => setBudget(Number(e.target.value))}
        aria-label="Budget maximum par pièce"
        className="range-klein mt-6 w-full"
        style={{ "--range-fill": `${fillPct}%` } as CSSProperties}
      />
      <button
        onClick={finish}
        disabled={finishing}
        className="mt-10 flex items-center justify-center gap-2 rounded-xl bg-klein py-3.5 font-semibold text-chalk transition-transform duration-150 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {finishing && <Spinner />}
        {finishing ? "Préparation..." : "Voir ma sélection"}
      </button>
    </main>
  );
}
