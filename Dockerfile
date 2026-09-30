# syntax=docker/dockerfile:1.7
# One image, three roles (selected by the command):
#   web      node server.js                  (default)
#   worker   node dist/worker.js
#   migrate  npx prisma migrate deploy

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-trixie-slim AS base
# OpenSSL is required by the Prisma engines (and lets Prisma detect the right one).
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund \
    && npx prisma generate

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data

# Full production node_modules (worker, prisma CLI), then the traced Next.js server on top
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json ./package.json

RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000

# Run with an init process (docker run --init / compose `init: true`) for signal forwarding.
CMD ["node", "server.js"]
