# Spinema

Application Android pour choisir quoi regarder, seul ou à plusieurs. On range ses films sur une étagère de vieilles VHS, on ouvre une séance avec ses amis, la machine pioche une cassette et chacun vote OK ou veto, en direct sur tous les téléphones.

- Plan complet : [PLAN.md](PLAN.md)
- Charte graphique : [design/charte-graphique.html](design/charte-graphique.html)
- Maquette cliquable (Galaxy A56) : [mockup/spinema-maquette.html](mockup/spinema-maquette.html)
- Reste à faire : [TODO.md](TODO.md)

## Statut

**Étape 1 : socle technique.** Monorepo, API avec healthcheck et WebSocket, base PostgreSQL avec migrations, app Expo qui charge la charte et interroge l'API, page d'invitation, Docker et CI. Aucune fonctionnalité métier pour l'instant (comptes à l'étape 2).

## Stack

| Partie       | Techno                                                                               |
| ------------ | ------------------------------------------------------------------------------------ |
| App mobile   | Expo SDK 58 (React Native 0.88), Expo Router, TypeScript                             |
| API          | Node 24, Fastify 5, Socket.IO, zod                                                   |
| Base         | PostgreSQL 17, Drizzle ORM (migrations SQL dans `packages/db/drizzle`)               |
| Code partagé | `packages/shared` : logique du tirage et des votes, schémas zod, tokens de la charte |
| Page web     | HTML statique servi par Nginx (`/i/<code>`, `assetlinks.json`)                       |
| Outillage    | pnpm 12 (workspaces), Turborepo, TypeScript 6, ESLint, Prettier, Vitest, Jest        |

```
apps/
  api/       API Fastify + Socket.IO
  mobile/    App Expo (Android)
  web/       Page d'invitation et de téléchargement
packages/
  shared/    Logique pure, schémas, thème
  db/        Client Drizzle et migrations
infra/nginx/ Config du conteneur web et exemple pour le Nginx du serveur
```

## Prérequis

- Node 24 (`nvm install` lit `.nvmrc`)
- pnpm 12 : `corepack enable pnpm`
- Docker et Docker Compose
- Pour l'app : l'application **Expo Go** sur le téléphone, ou un émulateur Android

## Installation

```bash
pnpm install
cp .env.example .env
```

Puis remplir `.env` (au minimum `POSTGRES_PASSWORD`, et le même mot de passe dans `DATABASE_URL`).

## Lancer en local

Base de données seule, dans Docker :

```bash
docker compose -f docker-compose.dev.yml up -d
```

API en mode développement (rechargement automatique, migrations appliquées au démarrage) :

```bash
pnpm --filter @spinema/api dev
```

App mobile :

```bash
pnpm --filter @spinema/mobile start
```

Scanner le QR code avec Expo Go. L'écran d'accueil affiche « ▶ PLAY » sur le magnéto quand l'API répond.

### Tester sur un vrai téléphone

1. `cp apps/mobile/.env.example apps/mobile/.env` et y mettre `EXPO_PUBLIC_API_URL=http://<IP Wi-Fi du PC>:3000` (sous Windows : `ipconfig`, « Adresse IPv4 » de la carte Wi-Fi).
2. Dans le `.env` racine, `API_BIND=0.0.0.0`, puis `docker compose up -d`.
3. Sous WSL2, le téléphone ne voit pas les ports d'Ubuntu par défaut (mode réseau NAT). Passer WSL en réseau « mirrored » : dans `%UserProfile%\.wslconfig`, section `[wsl2]`, ajouter `networkingMode=mirrored`, puis `wsl --shutdown`. Autoriser ensuite les ports 3000 et 8081 dans le pare-feu Windows.
4. Sans toucher à WSL, on peut aussi lancer l'app en tunnel : `pnpm --filter @spinema/mobile start --tunnel` (l'API doit rester joignable, voir l'étape 3).

## Lancer avec Docker (une commande)

```bash
docker compose up -d --build
```

| Service    | Adresse                                          |
| ---------- | ------------------------------------------------ |
| API        | http://127.0.0.1:3000/health                     |
| Page web   | http://127.0.0.1:8080 (invitation : `/i/<code>`) |
| PostgreSQL | interne au réseau Docker                         |

Les ports ne sont publiés que sur `127.0.0.1` : sur le serveur, le Nginx existant fait le HTTPS et renvoie vers eux (exemple : [infra/nginx/spinema.example.conf](infra/nginx/spinema.example.conf)).

## Vérifications

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Couverture minimale : 100 % pour `packages/shared`, 90 % pour l'API, 80 % pour l'app. La CI GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) lance tout ça sur chaque pull request et sur `dev`, `preprod` et `main` (voir « Branches et versions »).

## Branches et versions

| Branche            | Rôle                                                  | Ce que lance GitHub                                                                              |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `dev` (par défaut) | Travail de tous les jours, les PR arrivent ici        | Vérifications rapides (format, lint, types, tests, build)                                        |
| `preprod`          | Version à tester : on y fusionne `dev`                | + APK « Spinema préprod » (release `preprod`), image Docker `:preprod` et déploiement du staging |
| `main`             | Production : on y fusionne `preprod` une fois validée | + APK et AAB de prod (release `v<version>`) et image Docker `:main`                              |

- Les builds Android (~25 min) ne tournent que sur `preprod` et `main`, pour économiser les minutes GitHub Actions. Un build à la main reste possible : onglet Actions > Android > Run workflow.
- **Avant de fusionner dans `main`**, augmenter `version` dans [apps/mobile/app.config.ts](apps/mobile/app.config.ts) : le build s'arrête si cette version est déjà publiée.
- L'app préprod s'appelle « Spinema préprod », s'installe à côté de la vraie et affiche un bout de scotch « préprod ».
- Les adresses de l'API pour chaque variante sont des variables GitHub : `API_URL_PREVIEW` et `API_URL_PRODUCTION`.
- La clé de signature Android se crée une fois avec `./scripts/create-android-keystore.sh` (il enregistre lui-même les secrets GitHub).

## Staging

Le staging tourne sur le serveur partagé `vps2`, dans `/opt/spinema-staging`. Chaque push sur `preprod` y déploie l'image `:preprod`, via le job « Deploy staging » de la CI.

- **Mise en place**, une seule fois et à lancer soi-même : `./scripts/setup-staging-server.sh <domaine>`. Le script crée l'utilisateur `spinema` et le dossier, ainsi qu'une clé de déploiement qui ne peut lancer que [infra/staging/deploy.sh](infra/staging/deploy.sh). Il ajoute aussi la sauvegarde quotidienne, le site Nginx `staging.<domaine>` et `api.staging.<domaine>` avec HTTPS, et les secrets et variables GitHub.
- **Avant le script**, il faut deux entrées DNS, `staging.<domaine>` et `api.staging.<domaine>`, qui pointent vers l'IP du serveur.
- **La stack**, décrite dans [infra/staging/docker-compose.yml](infra/staging/docker-compose.yml), n'écoute qu'en local (API sur `127.0.0.1:3100`, page web sur `127.0.0.1:8180`). Le Nginx du serveur fait le relais.
- **D'autres services de prod tournent sur ce serveur** : on n'ajoute qu'un fichier de site Nginx, on lance `nginx -t` avant chaque rechargement, et on ne redémarre aucun autre service.
- **Sur le serveur** : `cd /opt/spinema-staging && docker compose logs -f api`. Le fichier `.env` contient le mot de passe de la base et ne quitte jamais le serveur.

## Variables d'environnement

| Variable                                            | Rôle                                           | Défaut                                            |
| --------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Base PostgreSQL (Docker)                       | `spinema` / à définir / `spinema`                 |
| `DATABASE_URL`                                      | Connexion de l'API à la base                   | requis                                            |
| `API_PORT`                                          | Port de l'API                                  | `3000`                                            |
| `API_BIND`                                          | Adresse de publication de l'API par Docker     | `127.0.0.1` (`0.0.0.0` pour tester sur téléphone) |
| `LOG_LEVEL`                                         | Niveau de logs (`info`, `debug`…)              | `info`                                            |
| `CORS_ORIGINS`                                      | Origines autorisées, séparées par des virgules | `http://localhost:8080`                           |
| `EXPO_PUBLIC_API_URL` (dans `apps/mobile/.env`)     | Adresse de l'API vue par l'app                 | `http://10.0.2.2:3000` (émulateur)                |

Les variables TMDB, Better Auth et SMTP (Brevo) arriveront avec les étapes suivantes ; elles sont déjà listées en commentaire dans `.env.example`.

## Base de données

Les migrations SQL sont dans `packages/db/drizzle` et s'appliquent au démarrage de l'API. Après avoir modifié `packages/db/src/schema.ts` :

```bash
pnpm db:generate
```

## Licence

MIT, voir [LICENSE](LICENSE).
