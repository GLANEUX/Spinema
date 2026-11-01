# Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:26-alpine AS build
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
 && pnpm --filter @spinema/api deploy --prod --legacy /out

FROM node:26-alpine AS runtime
ENV NODE_ENV=production MIGRATIONS_FOLDER=/app/drizzle
WORKDIR /app
# Only the API's production dependencies (pnpm deploy); workspace packages are bundled into dist.
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
COPY --from=build /repo/apps/api/dist ./dist
COPY packages/db/drizzle ./drizzle
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "--enable-source-maps", "dist/index.js"]
