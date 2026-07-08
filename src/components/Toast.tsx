export interface ToastProps {
  message: string;
  visible: boolean;
}

// Toast presentational : l'appelant pilote `visible` (et la duree via son propre setTimeout).
// Position fixe au-dessus de la tab bar, meme gabarit que ConsentBanner.
export default function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="animate-fade-in-up rounded-2xl bg-ink px-4 py-2.5 text-sm text-chalk shadow-lg"
      >
        {message}
      </div>
    </div>
  );
}
