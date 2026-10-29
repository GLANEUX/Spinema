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
- [ ] Déploiement staging : stack `docker compose` sur le serveur (`staging.<domaine>`), job CI qui fait `docker compose pull && up -d` en SSH (secrets : hôte, utilisateur, clé)
- [x] Variantes de l'app : dev (Expo Go), préprod (« Spinema préprod », installable à côté), prod
- [x] Build Android avec Gradle dans GitHub Actions : APK préprod sur `main`, APK + AAB sur les tags `v*`
- [ ] Créer la clé de signature : `./scripts/create-android-keystore.sh` (à lancer soi-même), puis mettre l'empreinte SHA-256 dans `assetlinks.json`
- [ ] Variables GitHub `API_URL_PREVIEW` et `API_URL_PRODUCTION` (adresses de l'API staging et prod)
- [ ] Play Console : créer l'app `com.glaneux.spinema`, envoyer le premier AAB à la main en test interne
- [ ] Plus tard : EAS Update (mises à jour sans passer par le Play Store) et envoi automatique de l'AAB sur le Play Store
- [ ] Tests e2e Maestro sur émulateur
- [x] Tests de la base sur un vrai Postgres (Testcontainers)
- [x] Scripts de sauvegarde quotidienne et de test de restauration (`infra/backup/`)
- [ ] Les mettre en cron sur le serveur et copier `backups/` hors du serveur
- [x] Dependabot (npm, GitHub Actions, Docker) ; secrets scannés par GitGuardian

## Améliorations connues

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
