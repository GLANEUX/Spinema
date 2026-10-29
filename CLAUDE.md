# CLAUDE.md

Spinema : app Android (Expo) + API TypeScript, en monorepo pnpm. Le plan produit est dans `PLAN.md`, la charte dans `design/charte-graphique.html`, la maquette de référence dans `mockup/spinema-maquette.html`. Tout le texte visible par l'utilisateur est en français.

## Commandes

- Installer : `pnpm install` (pnpm 12 via `corepack enable pnpm`, Node 24)
- Tout vérifier : `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- Base de dev : `docker compose -f docker-compose.dev.yml up -d`
- API : `pnpm --filter @spinema/api dev` · tests : `pnpm --filter @spinema/api test`
- App : `pnpm --filter @spinema/mobile start` · ajouter un paquet natif : `cd apps/mobile && pnpm exec expo install <paquet>`
- Stack complète : `docker compose up -d --build` puis `curl 127.0.0.1:3000/health`
- Nouvelle migration : modifier `packages/db/src/schema.ts` puis `pnpm db:generate`

## Conventions

- La logique de tirage, de filtres et de votes vit dans `packages/shared/src/draw.ts`, en fonctions pures testées à 100 %.
- Les paquets `@spinema/*` exportent leurs sources TypeScript ; l'API les embarque au build (tsup).
- `node-linker=hoisted` est requis par Expo (Metro).
- TypeScript reste en 6.0 tant que `typescript-eslint` ne supporte pas la 7.
- L'interface suit la charte : des objets (télé, magnéto, télécommande, cassettes), pas de cartes ni de petits titres en capitales.
