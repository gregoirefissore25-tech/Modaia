import { useEffect, useRef, useState } from "react";
import type { Product } from "../lib/types";
import { price } from "../lib/types";
import { IconHeart, IconX } from "./icons";

export type SwipeAction = "like" | "pass" | "save";

export type SwipeCardProps = {
  product: Product;
  onSwipe: (action: "like" | "pass") => void;
  /** Seule la carte du dessus de la pile est draggable. */
  interactive?: boolean;
  /** Quand definie, la carte s'anime hors ecran puis previent le parent via onExited. */
  exiting?: SwipeAction | null;
  onExited?: () => void;
};

const SWIPE_THRESHOLD_PX = 90;
const BADGE_THRESHOLD_PX = 40;
const EXIT_DURATION_MS = 220;

const EXIT_TRANSFORMS: Record<SwipeAction, string> = {
  like: "translateX(120%) rotate(12deg)",
  pass: "translateX(-120%) rotate(-12deg)",
  save: "translateY(-120%)"
};

// Carte swipe : drag pointer + boutons. L'etiquette prix rotative est la signature visuelle.
export default function SwipeCard({
  product,
  onSwipe,
  interactive = true,
  exiting = null,
  onExited
}: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Reinitialise par remount : Explore pose key={product.id} sur chaque carte.
  const [loaded, setLoaded] = useState(false);
  const startX = useRef<number | null>(null);

  // La sortie est calee sur la duree de la transition (setTimeout, robuste meme si
  // prefers-reduced-motion coupe la transition).
  useEffect(() => {
    if (!exiting || !onExited) return;
    const timer = setTimeout(onExited, EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [exiting, onExited]);

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
      // Pas de reset de dx : la transition de sortie part de la position relachee.
      onSwipe(dx > 0 ? "like" : "pass");
      return;
    }
    setDx(0); // snap-back anime (la transition se reactive hors drag)
  };

  const transform = exiting
    ? EXIT_TRANSFORMS[exiting]
    : `translateX(${dx}px) rotate(${dx / 25}deg)`;
  const handlers = interactive
    ? { onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp }
    : {};

  return (
    <div
      className={`relative h-full w-full touch-none select-none overflow-hidden rounded-2xl bg-white shadow-xl ${
        dragging ? "" : "transition-[transform,opacity] duration-200 ease-out"
      } ${!interactive || exiting ? "pointer-events-none" : ""}`}
      style={{ transform, opacity: exiting ? 0 : 1 }}
      {...handlers}
    >
      {/* Skeleton sous l'image le temps du chargement ; pointer-events-none pour
          que le drag (pointer capture sur e.target) reste capte par l'img. */}
      {!loaded && <div className="skeleton pointer-events-none absolute inset-0" />}
      <img
        src={product.image_url}
        alt={product.title}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
      />
      <div className="tag font-display text-lg">{price(product.price_cents, product.currency)}</div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-12 text-chalk">
        <p className="text-xs uppercase tracking-widest text-blush">{product.brand} · {product.merchant}</p>
        <p className="font-display text-lg leading-tight">{product.title}</p>
      </div>
      {(dx > BADGE_THRESHOLD_PX || exiting === "like") && (
        <Badge text="J'aime" icon={<IconHeart className="h-4 w-4" />} cls="left-4 bg-klein" />
      )}
      {(dx < -BADGE_THRESHOLD_PX || exiting === "pass") && (
        <Badge text="Passe" icon={<IconX className="h-4 w-4" />} cls="right-4 bg-ink" />
      )}
    </div>
  );
}

function Badge({ text, icon, cls }: { text: string; icon: React.ReactNode; cls: string }) {
  return (
    <span
      className={`absolute top-4 flex animate-scale-in items-center gap-1.5 rounded-full py-1.5 pl-3 pr-3.5 font-display text-chalk shadow-[0_6px_18px_-4px_rgba(20,19,18,0.4)] ${cls}`}
    >
      {icon}
      {text}
    </span>
  );
}
