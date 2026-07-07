import { useRef, useState } from "react";
import type { Product } from "../lib/types";
import { price } from "../lib/types";

type Props = {
  product: Product;
  onSwipe: (action: "like" | "pass") => void;
};

// Carte swipe : drag pointer + boutons. L'etiquette prix rotative est la signature visuelle.
export default function SwipeCard({ product, onSwipe }: Props) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);

  const onDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (startX.current !== null) setDx(e.clientX - startX.current);
  };
  const onUp = () => {
    if (Math.abs(dx) > 90) onSwipe(dx > 0 ? "like" : "pass");
    startX.current = null;
    setDx(0);
  };

  return (
    <div
      className="relative h-full w-full touch-none select-none overflow-hidden rounded-2xl bg-white shadow-xl transition-transform"
      style={{ transform: `translateX(${dx}px) rotate(${dx / 25}deg)` }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <img
        src={product.image_url}
        alt={product.title}
        className="h-full w-full object-cover"
        draggable={false}
      />
      <div className="tag font-display text-lg">{price(product.price_cents, product.currency)}</div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-12 text-chalk">
        <p className="text-xs uppercase tracking-widest text-blush">{product.brand} · {product.merchant}</p>
        <p className="font-display text-lg leading-tight">{product.title}</p>
      </div>
      {dx > 40 && <Badge text="J'aime" cls="left-4 bg-klein" />}
      {dx < -40 && <Badge text="Passe" cls="right-4 bg-ink" />}
    </div>
  );
}

function Badge({ text, cls }: { text: string; cls: string }) {
  return (
    <span className={`absolute top-4 rounded px-3 py-1 font-display text-chalk ${cls}`}>
      {text}
    </span>
  );
}
