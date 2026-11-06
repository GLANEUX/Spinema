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
- [x] Pousser sur GitHub et vérifier que la CI passe (sauf GitGuardian : faux positif sur un ancien mot de passe d'exemple)
- [x] Tester l'app sur le Galaxy A56 avec Expo Go (WSL en réseau « mirrored »)
- [x] Staging : stack [infra/staging](infra/staging), job CI « Deploy staging » sur `preprod` (clé SSH limitée à `deploy.sh`)
- [ ] Lancer `./scripts/setup-staging-server.sh <domaine>` (à faire soi-même, après les DNS `staging.` et `api.staging.`), puis pousser `dev` sur `preprod` pour le premier déploiement
- [x] Variantes de l'app : dev (Expo Go), préprod (« Spinema préprod », installable à côté), prod
- [x] Branches `dev` / `preprod` / `main` ; build Android avec Gradle seulement sur `preprod` (APK préprod) et `main` (APK + AAB, release `v<version>`)
- [ ] Créer la clé de signature : `./scripts/create-android-keystore.sh` (à lancer soi-même), puis mettre l'empreinte SHA-256 dans `assetlinks.json`
- [ ] Variables GitHub `API_URL_PREVIEW` et `API_URL_PRODUCTION` (adresses de l'API staging et prod)
- [ ] Play Console : créer l'app `com.glaneux.spinema`, envoyer le premier AAB à la main en test interne
- [ ] Plus tard : EAS Update (mises à jour sans passer par le Play Store) et envoi automatique de l'AAB sur le Play Store
- [ ] Tests e2e Maestro sur émulateur
- [x] Tests de la base sur un vrai Postgres (Testcontainers)
- [x] Scripts de sauvegarde quotidienne et de test de restauration (`infra/backup/`)
- [x] Cron de sauvegarde sur le serveur (posé par `setup-staging-server.sh`)
- [ ] Copier `/opt/spinema-staging/backups/` hors du serveur (rclone, rsync…)
- [x] Dependabot (npm, GitHub Actions, Docker) ; secrets scannés par GitGuardian

## Améliorations connues

- Node 26 (LTS depuis octobre 2026) : passer `.nvmrc`, la CI et `apps/api/Dockerfile` ensemble (Dependabot ignore les versions majeures de Node).
- `pnpm-workspace.yaml` contient une liste `minimumReleaseAgeExclude` pour des paquets Expo installés le jour de leur sortie : la supprimer (elle ne sert plus après 24 h).
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
