# Modaia

Ton style, en un swipe. Découverte mode en swipe, web app PWA + apps mobiles (Capacitor), monétisation par affiliation. Domaine : modaia.org.

## Démarrage

1. Neon : créer un projet sur console.neon.tech, copier la connection string pooled
2. `cp .env.example .env` et remplir DATABASE_URL
3. `npm install`
4. `npm run db:push && npm run db:seed`
5. `npm install -g netlify-cli` puis `npm run dev` (ouvre sur :8888, functions incluses)

## Déploiement (modaia.org)

1. Push sur GitHub, connecter le repo dans Netlify (build et redirects déjà dans netlify.toml)
2. Variables d'environnement Netlify : DATABASE_URL, SKIMLINKS_PUBLISHER_ID, AWIN_FEED_URLS, ADMIN_TOKEN
3. Netlify > Domain management > Add domain > modaia.org
4. Chez Spaceship : pointer les nameservers du domaine vers ceux fournis par Netlify DNS
   (ou créer un A record vers l'IP Netlify + CNAME www). SSL automatique via Let's Encrypt.

## Mobile

`npm run build && npx cap add ios && npx cap add android && npm run cap:sync`
Ouvrir dans Xcode / Android Studio pour signer et publier. appId : org.modaia.app.

## Monétisation

Chaque clic sortant passe par `/api/go` qui logge un subid puis redirige vers le marchand
(deep link Awin ou wrapper Skimlinks). Les commissions sont rapprochées via le subid
(postback /api/conversions). Le lookbook groupe les articles par marchand : un bouton de
commande par marque, pas de checkout unifié en V1 (voir CLAUDE.md, tâche C1).
