// Spinner CSS minimal (16px) pour les etats de chargement dans les boutons.
// Herite la couleur du texte courant via border-current (chalk sur klein/ink, klein sur bouton texte).
export default function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
