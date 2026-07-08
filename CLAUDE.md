# Modaia - Instructions Claude Code

App de découverte mode en swipe (web + mobile), monétisée à la commission d'affiliation.
Domaine : modaia.org. Tagline : "Ton style, en un swipe."
Modèle : feed Explore type Tinder, lookbook groupé par marchand, un checkout par marque via lien affilié tracké.
Positionnement : marché francophone d'abord (océan Indien, Afrique francophone), les concurrents (Styl, DressDrop, Fits, StyleSwipe) sont tous anglophones.

## Stack (ne pas dévier)
- Front : React 18 + Vite + TypeScript + Tailwind, PWA (vite-plugin-pwa), Capacitor pour iOS/Android (appId org.modaia.app)
- Back : Netlify Functions (TS, runtime Request/Response)
- DB : Neon Postgres via @neondatabase/serverless (jamais de client pg classique en function)
- Déploiement : Netlify + domaine modaia.org, repo GitHub, CI par push sur main
- Style d'écriture des textes UI : français, pas de tirets cadratins, pas de formules creuses

## Conventions
- Toutes les functions passent par netlify/functions/_db.ts (sql, getOrCreateUser, json)
- Identité V1 : device_id en localStorage (clés préfixées modaia_), échangé contre un uuid user en base
- Tout lien sortant vers un marchand passe par /api/go (jamais de lien direct), subid = uuid du clic
- Prix toujours en cents en base et en API, formatés côté front via price()

## Backlog

### F1 - Ingestion flux produits [FAIT - feed-sync.ts + _csv.ts, testé sur db/fixtures/awin-sample.csv]
Awin datafeeds CSV/gz via AWIN_FEED_URLS, mapping catégories, tags de style, upsert, hors stock si absent du flux.

### F2 - Scoring du feed [FAIT - products.ts : affinité style_vector x tags + fraîcheur + random découverte]

### F3 - Postback conversions [FAIT - conversions.ts (postback Awin/Skimlinks), admin.ts + page /admin protégée ADMIN_TOKEN]

### R1 - RGPD [FAIT en V1 - ConsentBanner, page /confidentialite (droits art.15-21 listés individuellement), purge clics >13 mois dans feed-sync. Reste : registre des traitements, DPA Neon/Netlify]

### R2 - Durcissement anti-abus [FAIT]
Validation format device_id (uuid) côté serveur sur tous les endpoints (products/saved/swipe/profile/go), sinon n'importe quelle chaîne arbitraire peuplait la table users sans contrôle. Postback conversions (conversions.ts) protégé par un secret optionnel `POSTBACK_SECRET` (query param `secret`, no-op tant que la variable d'env n'est pas définie ; si activé, mettre à jour le template d'URL de postback côté Awin/Skimlinks).
Rate limiting par IP (table `rate_limits`, fenêtre fixe, fail-open si la table est absente ou en cas d'erreur DB) sur products/saved/swipe/profile/go. **Nécessite `npm run db:push` avant déploiement** pour créer la table, sinon le rate limiting est simplement inactif (fail-open, aucune casse) jusqu'à la migration.

### F4 - Auth réelle [A FAIRE]
Clerk (plan gratuit) : lier device_id -> user Clerk à la première connexion, merger les swipes.

### F5 - Amazon PA-API [A FAIRE, optionnel selon stratégie catalogue]
Connecteur PA-API dans feed-sync à côté d'Awin. Contrainte : compte Amazon Associates validé + 3 ventes qualifiées sous 180 jours.

### C1 - Checkout unifié [V2, seulement si les données montrent que le split par marque tue la conversion]
Intégrer Violet.io. Garder le modèle split en fallback.

### M1 - Mobile stores [A FAIRE]
npx cap add ios && npx cap add android, icônes et splash, build TestFlight + Play Console interne.

## Commandes
- npm run dev : Netlify dev (front + functions + proxy /api)
- npm run db:push / db:seed : schéma et données de démo sur Neon
- npm run build : typecheck + build production
