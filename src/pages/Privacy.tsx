export default function Privacy() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-4 font-display text-2xl">Confidentialité</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink">
        <p><strong>Ce qu'on collecte.</strong> Un identifiant technique anonyme, tes swipes et filtres (pour personnaliser le feed), et les clics vers les marchands si tu as accepté (pour la commission d'affiliation).</p>
        <p><strong>Ce qu'on ne fait pas.</strong> Pas de revente de données, pas de publicité tierce, pas de profilage hors de l'app.</p>
        <p><strong>Durées.</strong> Les clics sont supprimés après 13 mois. Le reste est conservé tant que tu utilises l'app.</p>
        <p><strong>Tes droits.</strong> Accès, rectification, suppression : écris à privacy@modaia.org avec ton identifiant (Profil). Réponse sous 30 jours.</p>
        <p><strong>Affiliation.</strong> Les liens de commande sont affiliés (Awin, Skimlinks). La commission ne change pas ton prix. En tant que Partenaire Amazon, Modaia réalise un bénéfice sur les achats remplissant les conditions requises.</p>
      </div>
    </main>
  );
}
