# Spinema

[![CI](https://github.com/GLANEUX/Spinema/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/GLANEUX/Spinema/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/GLANEUX/Spinema/badge)](https://scorecard.dev/viewer/?uri=github.com/GLANEUX/Spinema)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-d9a441)](LICENSE)

**Choisir quoi regarder, seul ou à plusieurs.**

Spinema est une app Android pour en finir avec le « on regarde quoi ? ». On range ses films sur une étagère de vieilles cassettes VHS. Le soir venu, on ouvre une séance avec ses amis : la machine pioche une cassette au hasard, et chacun vote « OK » ou utilise un veto, en direct sur tous les téléphones.

L'interface est faite d'objets plutôt que d'écrans : une télé, un magnétoscope, une télécommande, des cassettes et des cartons.

| Pour découvrir le projet                                    |                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| Le plan complet (fonctionnalités, règles, choix techniques) | [PLAN.md](PLAN.md)                                           |
| La charte graphique « Vieilles VHS »                        | [design/charte-graphique.html](design/charte-graphique.html) |
| La maquette cliquable (format Galaxy A56)                   | [mockup/spinema-maquette.html](mockup/spinema-maquette.html) |
| Ce qui reste à faire                                        | [TODO.md](TODO.md)                                           |

## Avancement

Le projet avance par étapes ([PLAN.md §9](PLAN.md)).

- [x] **1. Socle** : monorepo, API, base de données, app Android, Docker, CI, staging en ligne, version de test sur Google Play.
- [x] **2. Sécurité** : en-têtes web, limites de requêtes, durcissement du temps réel et du serveur, politique de confidentialité.
- [ ] **3. Comptes** : inscription par e-mail (15 ans minimum), pseudo, date de naissance, espace perso.
- [ ] **4. Films** : recherche (TMDB), fiche, liste « À voir ».
- [ ] **5. Collections** : vu / pas vu, catégories automatiques.
- [ ] **6. La machine, en solo**.
- [ ] **7. Salons** entre amis.
- [ ] **8. La machine en salon** : séances, vetos, temps réel.
- [ ] **9. Découverte**.
- [ ] **10. Finitions et v1.0**.

L'app est en **test interne** sur Google Play. Une version de test est installable depuis la release [`preprod-latest`](https://github.com/GLANEUX/Spinema/releases/tag/preprod-latest).

## Stack

| Partie          | Technologies                                                                  |
| --------------- | ----------------------------------------------------------------------------- |
| App Android     | Expo SDK 58 (React Native 0.88), Expo Router, TypeScript                      |
| API             | Node 24, Fastify 5, Socket.IO (temps réel), zod                               |
| Base de données | PostgreSQL 17, Drizzle ORM                                                    |
| Page web        | HTML statique servi par Nginx (invitations `/i/<code>`, téléchargement)       |
| Outillage       | pnpm 12 (workspaces), Turborepo, TypeScript 6, ESLint, Prettier, Vitest, Jest |
| Déploiement     | Docker Compose, GitHub Actions, Nginx et Let's Encrypt                        |

```
apps/
  api/        API Fastify + Socket.IO
  mobile/     App Expo (Android)
  web/        Page web : accueil, invitations, téléchargement
packages/
  shared/     Logique du tirage et des votes, schémas, couleurs de la charte
  db/         Client Drizzle et migrations SQL
infra/        Nginx, staging (Compose, déploiement, code d'accès), sauvegardes
scripts/      Mise en place du serveur et des secrets
```

## Démarrer

### Prérequis

- **Node 24** : `nvm install` lit le fichier `.nvmrc`.
- **pnpm 12** : `corepack enable pnpm`.
- **Docker** avec Docker Compose.
- Pour l'app : **Expo Go** sur un téléphone Android, ou un émulateur.

### Installation

```bash
pnpm install
cp .env.example .env
```

Dans `.env`, choisir un mot de passe pour `POSTGRES_PASSWORD` et le reporter dans `DATABASE_URL`.

### Tout lancer avec Docker

```bash
docker compose up -d --build
```

| Service           | Adresse                      |
| ----------------- | ---------------------------- |
| API               | http://127.0.0.1:3000/health |
| Page web          | http://127.0.0.1:8080        |
| PostgreSQL        | interne au réseau Docker     |
| E-mails (Mailpit) | http://127.0.0.1:8025        |

### Développer

```bash
docker compose -f docker-compose.dev.yml up -d   # la base et Mailpit
pnpm --filter @spinema/api dev                   # l'API, rechargée à chaque modification
pnpm --filter @spinema/mobile start              # l'app : scanner le QR code avec Expo Go
```

Les migrations s'appliquent au démarrage de l'API. L'écran d'accueil de l'app affiche « ▶ PLAY » sur le magnétoscope quand l'API répond.

**Les e-mails** (vérification, mot de passe oublié) n'arrivent jamais dans une vraie boîte en local : **Mailpit** les attrape tous, et on les lit sur http://127.0.0.1:8025. Avec l'API lancée hors Docker, mettre `SMTP_HOST=localhost` et `SMTP_PORT=1025` dans `.env`. Sans `SMTP_HOST`, l'API écrit les e-mails dans ses logs.

<details>
<summary><strong>Tester sur un vrai téléphone (Wi-Fi, WSL)</strong></summary>

1. `cp apps/mobile/.env.example apps/mobile/.env`, puis y mettre `EXPO_PUBLIC_API_URL=http://<IP Wi-Fi du PC>:3000`. Sous Windows, l'IP se trouve avec `ipconfig`, ligne « Adresse IPv4 » de la carte Wi-Fi.
2. Dans le `.env` racine, mettre `API_BIND=0.0.0.0`, puis lancer `docker compose up -d`.
3. Sous WSL2, le téléphone ne voit pas les ports d'Ubuntu par défaut. Dans `%UserProfile%\.wslconfig`, section `[wsl2]`, ajouter `networkingMode=mirrored`, puis lancer `wsl --shutdown`. Autoriser ensuite les ports 3000 et 8081 dans le pare-feu Windows.
4. Autre solution, sans toucher à WSL : `pnpm --filter @spinema/mobile start --tunnel`. L'API doit quand même rester joignable (étape 3).

</details>

### Base de données

Après avoir modifié `packages/db/src/schema.ts`, générer la migration :

```bash
pnpm db:generate
```

## Vérifier son travail

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Couverture minimale des tests : 100 % pour la logique partagée, 90 % pour l'API, 80 % pour l'app. La CI relance tout sur chaque pull request, avec en plus `expo-doctor`, CodeQL et GitGuardian.

## Branches et versions

| Branche            | Rôle                                                       | Ce que lance GitHub                                 |
| ------------------ | ---------------------------------------------------------- | --------------------------------------------------- |
| `dev` (par défaut) | Le travail courant : toutes les pull requests arrivent ici | Vérifications                                       |
| `preprod`          | Une version à tester : on y pousse `dev`                   | + déploiement du staging et APK « Spinema préprod » |
| `main`             | La production : on y pousse `preprod` une fois validée     | + APK et AAB signés, release `v<version>`           |

Avant de pousser sur `main`, augmenter `version` dans [apps/mobile/app.config.ts](apps/mobile/app.config.ts) : le build refuse une version déjà publiée.

Les détails (staging, secrets, clé de signature, sauvegardes) sont dans [docs/deploiement.md](docs/deploiement.md).

## Variables d'environnement

| Variable                                               | Rôle                                                                     | Défaut                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`    | Base PostgreSQL (Docker)                                                 | `spinema` / à choisir / `spinema`         |
| `DATABASE_URL`                                         | Connexion de l'API à la base                                             | requise                                   |
| `API_PORT`                                             | Port de l'API                                                            | `3000`                                    |
| `API_BIND`                                             | Adresse sur laquelle Docker publie l'API                                 | `127.0.0.1` (`0.0.0.0` pour un téléphone) |
| `LOG_LEVEL`                                            | Niveau de logs (`info`, `debug`…)                                        | `info`                                    |
| `CORS_ORIGINS`                                         | Origines web autorisées, séparées par des virgules                       | `http://localhost:8080`                   |
| `TRUST_PROXY`                                          | Nombre de proxys devant l'API (pour voir la vraie adresse des visiteurs) | `0` (`1` derrière le Nginx du serveur)    |
| `BETTER_AUTH_SECRET`                                   | Signature des sessions, 32 caractères minimum (`openssl rand -hex 32`)   | requise par Docker et en prod             |
| `BETTER_AUTH_URL`                                      | Adresse publique de l'API (liens des e-mails)                            | `http://localhost:3000`                   |
| `REQUIRE_EMAIL_VERIFICATION`                           | E-mail vérifié avant la première connexion                               | `true`                                    |
| `PWNED_PASSWORD_CHECK`                                 | Refuser les mots de passe qui ont fuité (Have I Been Pwned)              | `true`                                    |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Envoi des e-mails ; sans `SMTP_HOST`, ils vont dans les logs             | Mailpit avec Docker en local              |
| `MAIL_FROM`                                            | Expéditeur des e-mails                                                   | `Spinema <noreply@spinema.fr>`            |
| `APK_URL`                                              | Destination du bouton « Télécharger l'app »                              | la page des releases                      |
| `EXPO_PUBLIC_API_URL` (dans `apps/mobile/.env`)        | Adresse de l'API vue par l'app                                           | `http://10.0.2.2:3000` (émulateur)        |

Les règles des comptes (routes, champs, e-mails) sont décrites dans [docs/comptes.md](docs/comptes.md).

## Sécurité

Une faille ? Merci de la signaler en privé, comme expliqué dans [SECURITY.md](SECURITY.md), et pas dans une issue publique.

## Licence

[MIT](LICENSE) © Océane Glaneux
