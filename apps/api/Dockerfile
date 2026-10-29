# Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS build
# pnpm 12 fetches its native binary on first run: do it once, in its own cached layer.
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate && pnpm -v
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --filter "@spinema/api..."
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
RUN pnpm --filter @spinema/api build \
 && pnpm install --frozen-lockfile --prod --filter "@spinema/api..."

FROM node:24-alpine AS runtime
ENV NODE_ENV=production MIGRATIONS_FOLDER=/repo/apps/api/drizzle
# Same layout as the build stage: pnpm links apps/api/node_modules into /repo/node_modules/.pnpm.
WORKDIR /repo/apps/api
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY packages/db/drizzle ./drizzle
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "--enable-source-maps", "dist/index.js"]
