# Contentful Migration Tool

A web application for moving content and content models between Contentful environments and spaces safely: backups, restores, environment diffs, live transfers and a visual migration builder. Every change to an environment is preceded by an automatic safety backup.

## Features

- **Sign in with Contentful** (OAuth) or a personal access token. No separate registration. Tokens are encrypted at rest (AES-256-GCM) and never sent back to the browser.
- **Backups**: full environment exports (optionally with asset files), stored per user and downloadable as JSON or ZIP.
- **Restore**: from a stored backup or an uploaded export (+ asset archive), with content type and locale filtering and locale mapping.
- **Smart Migration**: diff two environments (content model, locales, entries) and migrate the selection with all dependencies.
- **Live Transfer**: CMA-to-CMA transfer between spaces and environments.
- **Visual Builder**: build content model migrations without code. Steps are validated on the server and executed with `contentful-migration`.
- **Views migration**, activity logs, admin dashboard (users, roles, suspension, settings, support tickets).

## Architecture

```
Browser ─▶ Caddy (TLS) ─▶ web: Next.js (UI + API) ─▶ PostgreSQL
                              │  ▲                    Redis: queue, job events, rate limits, locks
                              ▼  │
                           worker: BullMQ jobs ─▶ Contentful Management API
                    shared volume DATA_DIR: backups, archives, uploads
```

- Long operations run as **background jobs** in a separate worker. Browser disconnects and deploys don't interrupt them; progress is streamed over SSE and can be resumed.
- **One mutating job per target environment** at a time, a per-user limit on parallel jobs, and a **Contentful API rate limit shared by all workers**.
- Every API route goes through one pipeline: session → role → rate limit → zod validation → handler → uniform errors.

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech stack

Next.js 15 (Pages Router), React 19, TypeScript, Tailwind + shadcn/ui, TanStack Query · PostgreSQL + Prisma · Redis + BullMQ · `contentful-management`, `contentful-export`, `contentful-import`, `contentful-migration` · Docker, Caddy.

## Getting started (development)

Requirements: Node.js 22+, Docker.

```bash
cp .env.example .env              # set ENCRYPTION_KEY=$(openssl rand -base64 32)
docker compose up -d              # PostgreSQL and Redis on localhost
npm ci
npx prisma migrate deploy
npm run dev                       # http://localhost:3000
npm run worker:dev                # background jobs (separate terminal)
```

Sign in with a Contentful personal access token, or configure `CONTENTFUL_OAUTH_CLIENT_ID` (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#2-приложение-oauth-в-contentful)).

## Production

One command on a server with Docker: automatic HTTPS, migrations, web, worker, database backups.

```bash
cp .env.example .env.production   # fill in secrets and domain
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` / `npm run worker:dev` | Development server / worker with reload |
| `npm run build` | Prisma client, Next.js build, worker bundle (`dist/worker.js`) |
| `npm start` / `npm run worker` | Run the production build |
| `npm run db:migrate` | Apply database migrations |
| `npm run secrets:rotate` | Re-encrypt stored tokens with the current `ENCRYPTION_KEY` |
| `npm run lint` / `npm run typecheck` / `npm test` | Checks |

## Project structure

```
src/
├── pages/            UI pages and API routes (thin: validate → authorize → call server code)
├── server/           server-only code
│   ├── api.ts        API pipeline (auth, validation, rate limits, errors)
│   ├── auth/         sessions, Contentful sign-in
│   ├── contentful/   CMA client with shared rate limiter, credentials
│   ├── jobs/         job definitions, queue, events (SSE), runner, handlers
│   ├── storage.ts    per-user file storage under DATA_DIR
│   └── env.ts        validated configuration
├── worker/           background worker entrypoint
├── components/ hooks/ context/ utils/ types/
prisma/               schema and migrations
deploy/               Caddyfile, database backup script
```

## License

MIT
