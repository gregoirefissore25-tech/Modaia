import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import type { PanInfo } from "motion/react";
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
  /** Cartes empilees derriere : juste la photo, sans legende (evite le chevauchement
      de texte avec la carte du dessus, qui elle reste pleine opacite). */
  showDetails?: boolean;
};

const SWIPE_DISTANCE_PX = 90;
const SWIPE_VELOCITY_PX_S = 500; // un flick rapide declenche la decision meme sous la distance
const BADGE_THRESHOLD_PX = 40;
const EXIT_DURATION_S = 0.28;
const EXIT_SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

const EXIT_TARGET: Record<SwipeAction, { x: number; y: number }> = {
  like: { x: 520, y: 0 },
  pass: { x: -520, y: 0 },
  save: { x: 0, y: -760 }
};

// Carte swipe : drag physique (ressort, flick par velocite) via motion.
// L'etiquette prix rotative est la signature visuelle.
export default function SwipeCard({
  product,
  onSwipe,
  interactive = true,
  exiting = null,
  onExited,
  showDetails = true
}: SwipeCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [dragX, setDragX] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  // Clampe : la rotation plafonne a +-16deg meme si x continue au-dela pendant la sortie.
  const rotate = useTransform(x, [-300, 300], [-16, 16]);

  // Sortie animee (ressort) vers la cible de l'action, puis retrait de la pile
  // une fois la duree ecoulee (robuste meme si prefers-reduced-motion coupe l'anim).
  useEffect(() => {
    if (!exiting) return;
    const target = EXIT_TARGET[exiting];
    const controls = [
      animate(x, target.x, EXIT_SPRING),
      animate(y, target.y, EXIT_SPRING),
      animate(opacity, 0, { duration: 0.2 })
    ];
    const timer = setTimeout(() => onExited?.(), EXIT_DURATION_S * 1000);
    return () => {
      controls.forEach((c) => c.stop());
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  const handleDrag = (_: unknown, info: PanInfo) => setDragX(info.offset.x);
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_DISTANCE_PX || info.velocity.x > SWIPE_VELOCITY_PX_S) {
      onSwipe("like");
      return;
    }
    if (info.offset.x < -SWIPE_DISTANCE_PX || info.velocity.x < -SWIPE_VELOCITY_PX_S) {
      onSwipe("pass");
      return;
    }
    setDragX(0); // sous le seuil : dragConstraints ramene x/y a 0 avec un ressort natif
  };

  return (
    <motion.div
      className="relative h-full w-full touch-none select-none overflow-hidden rounded-lg bg-white shadow-xl"
      style={{ x, y, rotate, opacity, pointerEvents: !interactive || exiting ? "none" : undefined }}
      drag={interactive && !exiting ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 32 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      {/* Skeleton sous l'image le temps du chargement. */}
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
      {showDetails && (
        <>
          <div className="tag font-display text-lg">{price(product.price_cents, product.currency)}</div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent p-5 pt-16 text-chalk">
            <p className="text-xs uppercase tracking-[0.2em] text-blush">{product.brand} · {product.merchant}</p>
            <p className="mt-1 font-display text-2xl leading-tight tracking-tight">{product.title}</p>
          </div>
        </>
      )}
      {(dragX > BADGE_THRESHOLD_PX || exiting === "like") && (
        <Badge text="J'aime" icon={<IconHeart className="h-4 w-4" />} cls="left-4 bg-klein" />
      )}
      {(dragX < -BADGE_THRESHOLD_PX || exiting === "pass") && (
        <Badge text="Passe" icon={<IconX className="h-4 w-4" />} cls="right-4 bg-ink" />
      )}
    </motion.div>
  );
}

export function Badge({ text, icon, cls }: { text: string; icon: React.ReactNode; cls: string }) {
  return (
    <span
      className={`absolute top-4 flex animate-scale-in items-center gap-1.5 rounded-full py-1.5 pl-3 pr-3.5 font-display text-chalk shadow-[0_6px_18px_-4px_rgba(20,19,18,0.4)] ${cls}`}
    >
      {icon}
      {text}
    </span>
  );
}
