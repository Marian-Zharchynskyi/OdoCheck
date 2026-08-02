# OdoCheck — Initialization Plan (Init phase)

> Goal of this phase: stand up the monorepo's technical base (backend + frontend + docker), with no business logic. Result — a single init commit.

## 1. Project context

**Problem:** buyers of used cars in Ukraine (Auto.ria and others) constantly run into fraud: rolled-back mileage, hidden accidents, and swapped history. Commercial checks cost money, and information is scattered across the internet.

**Solution:** a free web app for checking vehicle history by license plate or VIN. Aggregates free data fragments from open registries and archived foreign auctions, normalizes them, and builds a mileage/accident timeline with "before repair" photos.

## 2. Technology stack (full target scope)

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo, full-stack TypeScript |
| Backend | NestJS (Express, with the option to switch to Fastify), Clean Architecture / DDD-lite (domain / application / infrastructure) |
| Process management | State Machine for the report lifecycle (CREATED → PROCESSING → SUCCESS/FAILED) |
| Background jobs | BullMQ + Redis (added later, once jobs exist) |
| Auth | Access token (in-memory) + Refresh token (HttpOnly/Secure/SameSite=Strict cookie), RBAC (later) |
| Relational DB | PostgreSQL — users, subscriptions, report metadata, logs |
| NoSQL DB | MongoDB — raw HTML/JSON dumps from scraping |
| Frontend | Next.js (App Router), Feature-Sliced Design (shared → entities → features → widgets → pages) |
| State | Redux Toolkit + per-request StoreProvider (SSR-safe), RTK Query (tag-based caching, stale-while-revalidate, optimistic updates, AbortController) |
| UI | ShadCN UI + Tailwind CSS, fonts Inter/Geist Sans + JetBrains Mono |
| Containerization | Docker Compose (spin up all local databases with one command) |

## 3. Scope of THIS init phase (base only)

Explicitly INCLUDED:
- Monorepo bootstrap: pnpm workspaces + Turborepo, root `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- `apps/backend` — empty NestJS scaffold (Node 24), Express adapter, health-check endpoint (`GET /health`)
- `apps/frontend` — empty Next.js (App Router) scaffold, Tailwind + ShadCN wired up, starter page
- Base folder structure for the planned architecture (no logic, just `.gitkeep`/README placeholders):
  - Backend: `src/domain`, `src/application`, `src/infrastructure`
  - Frontend: `src/shared`, `src/entities`, `src/features`, `src/widgets`, `src/pages` (FSD)
- `docker-compose.yml`: **PostgreSQL** + **MongoDB** only (no Redis/BullMQ — added once background jobs exist)
- Basic `.env.example` for backend (DB connection strings) and frontend
- Root configs: `.gitignore`, `.editorconfig`, base `tsconfig.json` (shared), `README.md` with run instructions
- Node version pinned via `.nvmrc` / `engines` = 24.x

Explicitly NOT included (later phases):
- Any business logic (VIN validation, scrapers, reports)
- Redis, BullMQ, workers
- Auth (JWT, refresh cookies, RBAC)
- Prisma/TypeORM schemas, real tables/collections
- CI/CD

## 4. Repository structure after init

```
OdoCheck/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── app/                 (Next.js App Router)
│       │   ├── shared/
│       │   ├── entities/
│       │   ├── features/
│       │   ├── widgets/
│       │   └── pages/
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── tsconfig.base.json
├── .editorconfig
├── .gitignore
├── .nvmrc
└── README.md
```

## 5. Docker Compose (init)

Services:
- `postgres:16-alpine` — port 5432, volume for persistence, healthcheck
- `mongo:7` — port 27017, volume, healthcheck

Redis is deliberately not added yet — it will arrive together with BullMQ during the background-jobs phase.

## 6. Execution steps

1. Bootstrap the monorepo git structure (`pnpm-workspace.yaml`, root `package.json`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.nvmrc` = 24)
2. Generate `apps/backend` via Nest CLI, trim boilerplate, add `/health`, create `domain/application/infrastructure` folders with README placeholders
3. Generate `apps/frontend` via `create-next-app` (TypeScript, App Router, Tailwind), wire up ShadCN, create FSD folders with placeholders
4. Write `docker-compose.yml` (postgres + mongo) and `.env.example` for both apps
5. Write the root `README.md` with instructions (`pnpm install`, `docker compose up -d`, `pnpm dev`)
6. Verify: `pnpm install`, `docker compose up -d`, backend starts and `/health` responds, frontend starts on its default port
7. One commit: `chore: init monorepo scaffold (backend, frontend, docker)`

## 7. Open questions (already resolved)

- Package manager: **pnpm + Turborepo** ✅
- Node: **24.x** ✅ (initially 22.x LTS was installed via nvm-windows, since 24.x wasn't installed yet at the time of the init phase; 24.18.1 is now available and pinned in `.nvmrc`/`engines`)
- Docker at this stage: **PostgreSQL + MongoDB** (no Redis) ✅
- Scope: **scaffold + base folder structure** ✅
- Project name: **OdoCheck** ✅
- Tooling installs (if needed globally) — on drive **D** ✅

## 8. Data layer phase (completed after init)

Added on top of the init scaffold, still with no auth:
- **PostgreSQL**: `@prisma/client` + `prisma` CLI, empty schema (`apps/backend/prisma/schema.prisma`), `PrismaService` (`src/infrastructure/database/prisma/`) connecting through `@prisma/adapter-pg` (Prisma 7 requires a driver adapter — `url` in the schema is no longer supported), a real `$queryRaw` health-check.
- **MongoDB**: `@nestjs/mongoose` + `mongoose`, `MongoModule` (`src/infrastructure/database/mongo/`) via `MongooseModule.forRootAsync` with `ConfigService`.
- **Config**: added `@nestjs/config` (`ConfigModule.forRoot({isGlobal: true})`) so `.env` is actually read.
- **`/health`** now returns the real state of both DBs: `{"status":"ok","postgres":"up","mongo":"up"}`.

See @CLAUDE.md for the gotchas discovered while wiring this up (Prisma generator choice, ESM vs CJS, Mongo `authSource`).
