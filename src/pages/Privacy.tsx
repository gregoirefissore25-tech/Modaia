const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Ce qu'on collecte",
    body: "Un identifiant technique anonyme, tes swipes et filtres (pour personnaliser le feed), et les clics vers les marchands si tu as accepté (pour la commission d'affiliation).",
  },
  {
    title: "Ce qu'on ne fait pas",
    body: "Pas de revente de données, pas de publicité tierce, pas de profilage hors de l'app.",
  },
  {
    title: "Durées",
    body: "Les clics sont supprimés après 13 mois. Le reste est conservé tant que tu utilises l'app.",
  },
  {
    title: "Tes droits",
    body: "Accès (savoir ce qu'on détient sur toi), rectification (corriger une donnée), effacement (supprimer ton compte et tes données), limitation (geler temporairement leur usage), portabilité (les récupérer dans un format réutilisable) et opposition (refuser la mesure des clics affiliés à tout moment, via le bandeau de consentement ou en nous écrivant). Pour exercer un droit : écris à privacy@modaia.org avec ton identifiant (Profil). Réponse sous 30 jours.",
  },
  {
    title: "Affiliation",
    body: "Les liens de commande sont affiliés (Awin, Skimlinks). La commission ne change pas ton prix. En tant que Partenaire Amazon, Modaia réalise un bénéfice sur les achats remplissant les conditions requises.",
  },
];

export default function Privacy() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="animate-fade-in-up">
        <h1 className="mb-6 font-display text-2xl">Confidentialité</h1>
        <div className="divide-y divide-seam">
          {SECTIONS.map(({ title, body }) => (
            <section key={title} className="py-5 first:pt-0 last:pb-0">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-klein">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
