// Retour haptique best-effort : vibration tres courte au swipe.
// No-op sur iOS Safari (pas de support de navigator.vibrate) et
// silencieux si le navigateur refuse (hors interaction, permission).
export function tapFeedback(): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  } catch {
    // ignore : feedback purement optionnel
  }
}
