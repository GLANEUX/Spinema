# Reste à faire

## Étape 1 : socle (en cours)

- [x] Monorepo pnpm + Turborepo, TypeScript, ESLint, Prettier
- [x] `packages/shared` : logique du tirage et des votes, testée à 100 %
- [x] `packages/db` : Drizzle, première migration (extension `citext`)
- [x] API Fastify : `/health`, erreurs typées, Socket.IO, migrations au démarrage
- [x] App Expo : Expo Router, polices de la charte, écran d'accueil qui interroge l'API
- [x] Page web : accueil, `/i/<code>`, `assetlinks.json`
- [x] Docker Compose (db, api, web) et compose de dev
- [x] CI : format, lint, typecheck, tests avec couverture, build, expo-doctor, image Docker sur GHCR
- [ ] Pousser sur GitHub et vérifier que la CI passe
- [ ] Tester l'app sur le Galaxy A56 avec Expo Go
- [ ] Déploiement staging : stack `docker compose` sur le serveur (`staging.<domaine>`), job CI qui fait `docker compose pull && up -d` en SSH (secrets : hôte, utilisateur, clé)
- [ ] Build APK signé dans GitHub Actions (`eas build --local`, keystore en secret) sur les tags `v*`
- [ ] EAS Update (canaux `staging` et `production`)
- [ ] Tests e2e Maestro sur émulateur
- [ ] Tests d'intégration de l'API sur un vrai Postgres (Testcontainers)
- [ ] Sauvegarde quotidienne Postgres (`pg_dump`) + test de restauration
- [ ] Renovate ou Dependabot, scan de secrets

## Améliorations connues

- Image Docker de l'API lourde (~600 Mo) : elle embarque tout `node_modules/.pnpm`. Passer à `pnpm deploy` ou à un bundle complet.
- Le healthcheck Docker appelle `/health` toutes les 30 s et remplit les logs : ne pas logger cette route.
- TypeScript 6.0 au lieu de 7 : `typescript-eslint` ne supporte pas encore TS 7.
- `assetlinks.json` contient une empreinte provisoire : à remplacer par celle du keystore de release.
- Les icônes et l'écran de démarrage de l'app sont ceux du modèle Expo : à refaire d'après la charte (cassette).
- `pnpm` 12 refuse les paquets publiés depuis moins de 24 h (`minimumReleaseAge`) : un `expo install` juste après une sortie peut bloquer l'installation jusqu'au lendemain.

## Étapes suivantes (voir PLAN.md §9)

2. Comptes (Better Auth, SMTP Brevo, pseudo, date de naissance, espace perso)
3. Films + À voir (proxy TMDB, recherche, fiche)
4. Collections, vu / pas vu, catégories auto
5. Machine en perso
6. Salons
7. Machine en salon (séances, vetos, temps réel)
8. Découverte
9. Finitions et v1.0
