# OdoCheck

Безкоштовний веб-агрегатор перевірки історії авто за держномером/VIN: збирає дані з відкритих реєстрів та архівів закордонних аукціонів, будує таймлайн пробігу та ДТП.

Детальний план та контекст проєкту — у [PLAN.md](./PLAN.md).

## Стек

- Монорепо: pnpm workspaces + Turborepo
- Backend: `apps/backend` — NestJS
- Frontend: `apps/frontend` — Next.js (App Router) + Tailwind + ShadCN UI
- БД: PostgreSQL (реляційні дані) + MongoDB (сирі дампи скрейпінгу), піднімаються через Docker Compose

## Вимоги

- Node.js 24.x
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker + Docker Compose

## Запуск

```bash
# 1. Встановити залежності
pnpm install

# 2. Підняти PostgreSQL + MongoDB
cp .env.example .env
docker compose up -d

# 3. Підготувати env-файли застосунків
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 4. Запустити backend + frontend у dev-режимі
pnpm dev
```

- Backend: http://localhost:3000 (health-check: `GET /health`)
- Frontend: http://localhost:3001 (або дефолтний порт Next.js, якщо вільний)

## Структура

```
apps/
├── backend/   NestJS: src/domain, src/application, src/infrastructure
└── frontend/  Next.js: src/shared, src/entities, src/features, src/widgets, src/pages
```
