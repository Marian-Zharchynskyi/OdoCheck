# OdoCheck

A free web aggregator for checking vehicle history by VIN/license plate. Full plan and context — @PLAN.md.

## Stack & versions

- Monorepo: pnpm workspaces + Turborepo, full TypeScript
- Node 24.x (`.nvmrc`). pnpm via corepack: `corepack enable && corepack prepare pnpm@latest --activate`
- Backend: `apps/backend` — NestJS (Express adapter), Clean Architecture (`src/domain`, `src/application`, `src/infrastructure`)
- Frontend: `apps/frontend` — Next.js App Router, Feature-Sliced Design (`src/shared → entities → features → widgets → pages`), Tailwind + ShadCN UI
- Data: PostgreSQL via Prisma (`apps/backend/prisma/schema.prisma`), MongoDB via Mongoose — both run via Docker Compose

## Commands

- Install dependencies: `pnpm install` (root)
- Dev for both apps: `pnpm dev` (root, via turbo)
- Backend only: `cd apps/backend && pnpm start:dev` (port 3000)
- Frontend only: `cd apps/frontend && pnpm dev` (port 3001 — 3000 is taken by the backend)
- Build: `pnpm build` (root) or per-app
- Backend tests: `cd apps/backend && pnpm test` (unit), `pnpm test:e2e` (e2e, requires running DBs)
- DBs: `docker compose up -d` (root) → Postgres :5432, Mongo :27017; `docker compose down` when done
- Prisma after a schema change: `cd apps/backend && npx prisma generate`; migration: `npx prisma migrate dev --name <name>`

## Architecture rules

- **Auth is intentionally not implemented yet** — do not add JWT/refresh cookies/RBAC unless explicitly asked
- Backend: business rules → `src/domain`, use cases → `src/application`, controllers/DB/external adapters → `src/infrastructure`
- Frontend (FSD): `shared` — reusable, no business logic, then upward `entities` → `features` → `widgets` → `pages`
- Redis/BullMQ not added yet — will come together with background scraping jobs, not before

## Known gotchas (Prisma 7 / Mongo)

- Prisma generator stays `prisma-client-js` **with no custom `output`**. The new ESM generator `prisma-client` and any `output` outside `node_modules` break require-path resolution once Nest compiles `src/` → `dist/src/` (shifts relative import depth). Always import `PrismaClient` from `@prisma/client`.
- Prisma 7 forbids `url` in the schema's `datasource` block — the connection string goes through a driver adapter (`@prisma/adapter-pg`) passed to the `PrismaClient` constructor, not into schema.prisma.
- The MongoDB container runs with a root user → the connection string must include `authSource=admin` (see `apps/backend/.env.example`).
- Mongoose's `Connection.readyState` is typed as the numeric enum `ConnectionStates`, not a plain `number` — compare against `ConnectionStates.connected` (imported from `mongoose`), not a bare `1` literal, or some TS configs flag it as an enum comparison with no shared type.

## Linting

- Run: `pnpm lint` (root, via turbo) or per-app `pnpm lint`
- Backend (`eslint.config.mjs`): `@eslint/js` recommended + `typescript-eslint` `recommendedTypeChecked` (type-aware) + `eslint-plugin-prettier/recommended`. Overrides: `@typescript-eslint/no-explicit-any` off, `@typescript-eslint/no-floating-promises` warn, `@typescript-eslint/no-unsafe-argument` warn, `prettier/prettier` error (`endOfLine: auto`)
- Frontend (`eslint.config.mjs`): `eslint-config-next` `core-web-vitals` + `typescript` presets
- `apps/backend/tsconfig.json` has no `paths`, so no `baseUrl` — don't re-add it just to silence editor noise; if a path alias is genuinely needed later, add `paths` and `baseUrl` together
- `apps/backend/tsconfig.json` sets `"types": ["node", "jest"]` explicitly — keep this in sync if a new ambient-type package (e.g. `@types/supertest` globals) is ever needed for tests
- If the editor's Problems panel shows TS6/7 `moduleResolution`/`baseUrl` deprecation warnings pointing at a `tsconfig.json` **inside `node_modules`** (e.g. rxjs's own shipped config) — that's not our code and can't be fixed here; it means that file got opened as a tab (often via "Go to Definition" into a dependency). Close the tab or run "TypeScript: Restart TS Server". `.vscode/settings.json` already excludes `node_modules` from search/watch to reduce how often this happens.

## Verification before considering work done

- Before backend e2e tests or manually checking `/health` — run `docker compose up -d` and wait until both containers are `healthy`
- `/health` checks a real connection to Postgres (`$queryRaw SELECT 1`) and Mongo (`readyState`) — don't simplify it back to a static `{status:"ok"}`
- After verifying, clean up: remove local test `.env` files, stop docker containers (`docker compose down`), don't leave build artifacts (`dist`, `.next`, `generated`) around unnecessarily

## Git

- Don't add `Co-Authored-By: Claude` to commits — the user removes Claude from GitHub contributors
- Don't commit without an explicit request — the user commits manually
