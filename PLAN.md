# OdoCheck — План ініціалізації (Init етап)

> Мета цього етапу: підняти технічну базу монорепозиторію (backend + frontend + docker), без бізнес-логіки. Результат — один init-коміт.

## 1. Контекст проєкту

**Проблема:** покупці вживаних авто в Україні (Auto.ria та ін.) стикаються зі скрученими пробігами, прихованими ДТП, підміною історії. Комерційні перевірки платні, дані розпорошені.

**Рішення:** безкоштовний веб-агрегатор перевірки історії авто за держномером/VIN. Збирає дані з відкритих реєстрів та архівів закордонних аукціонів, нормалізує їх, будує таймлайн пробігу та ДТП з фотографіями.

## 2. Технологічний стек (цільовий, повний)

| Шар | Технологія |
|---|---|
| Монорепо | pnpm workspaces + Turborepo, повний TypeScript |
| Backend | NestJS (Express, з можливістю перемкнути на Fastify), Clean Architecture / DDD-lite (domain / application / infrastructure) |
| Процеси | State Machine для життєвого циклу звіту (CREATED → PROCESSING → SUCCESS/FAILED) |
| Фонові задачі | BullMQ + Redis (буде додано пізніше, коли з'являться задачі) |
| Авторизація | Access token (in-memory) + Refresh token (HttpOnly/Secure/SameSite=Strict cookie), RBAC (пізніше) |
| Реляційна БД | PostgreSQL — users, subscriptions, метадані звітів, логи |
| NoSQL БД | MongoDB — сирі HTML/JSON дампи скрейпінгу |
| Frontend | Next.js (App Router), Feature-Sliced Design (shared → entities → features → widgets → pages) |
| Стейт | Redux Toolkit + StoreProvider per-request (SSR-safe), RTK Query (кешування, SWR, optimistic updates, AbortController) |
| UI | ShadCN UI + Tailwind CSS, шрифти Inter/Geist Sans + JetBrains Mono |
| Контейнеризація | Docker Compose (локальний підйом БД одним `docker compose up`) |

## 3. Обсяг ЦЬОГО init-етапу (лише база)

Явно ВХОДИТЬ:
- Ініціалізація монорепо: pnpm workspaces + Turborepo, корінний `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- `apps/backend` — порожній NestJS-каркас (Node 24), Express adapter, health-check ендпоінт (`GET /health`)
- `apps/frontend` — порожній Next.js (App Router) каркас, Tailwind + ShadCN підключені, стартова сторінка
- Базова структура папок під майбутню архітектуру (без логіки, лише `.gitkeep`/README у папках):
  - Backend: `src/domain`, `src/application`, `src/infrastructure`
  - Frontend: `src/shared`, `src/entities`, `src/features`, `src/widgets`, `src/pages` (FSD)
- `docker-compose.yml`: тільки **PostgreSQL** + **MongoDB** (без Redis/BullMQ — додамо, коли з'являться фонові задачі)
- Базові `.env.example` для backend (DB-конекшн стрінги) та frontend
- Кореневі конфіги: `.gitignore`, `.editorconfig`, base `tsconfig.json` (shared), `README.md` з інструкцією запуску
- Node версія зафіксована через `.nvmrc` / `engines` = 24.x

Явно НЕ входить (наступні етапи):
- Будь-яка бізнес-логіка (VIN-валідація, скрейпери, звіти)
- Redis, BullMQ, воркери
- Auth (JWT, refresh cookies, RBAC)
- Prisma/TypeORM-схеми, реальні таблиці/колекції
- CI/CD

## 4. Структура репозиторію після init

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

Сервіси:
- `postgres:16-alpine` — порт 5432, volume для персистентності, healthcheck
- `mongo:7` — порт 27017, volume, healthcheck

Redis свідомо не додається зараз — з'явиться разом з BullMQ на етапі фонових задач.

## 6. Кроки виконання

1. Ініціалізувати git-структуру монорепо (`pnpm-workspace.yaml`, корінний `package.json`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.nvmrc` = 24)
2. Згенерувати `apps/backend` через Nest CLI, підчистити boilerplate, додати `/health`, створити папки `domain/application/infrastructure` з `README.md`-заглушками
3. Згенерувати `apps/frontend` через `create-next-app` (TypeScript, App Router, Tailwind), підключити ShadCN, створити FSD-папки з заглушками
4. Написати `docker-compose.yml` (postgres + mongo) та `.env.example` для обох застосунків
5. Написати кореневий `README.md` з інструкціями (`pnpm install`, `docker compose up -d`, `pnpm dev`)
6. Перевірити: `pnpm install`, `docker compose up -d`, backend піднімається і `/health` відповідає, frontend піднімається на дефолтному порту
7. Один commit: `chore: init monorepo scaffold (backend, frontend, docker)`

## 7. Відкриті питання (вже узгоджено)

- Пакетний менеджер: **pnpm + Turborepo** ✅
- Node: **22.x LTS** (24.x недоступний через встановлений nvm-windows на цій машині; 22 LTS повністю сумісний з NestJS 11 / Next.js 15) ✅
- Docker на цьому етапі: **PostgreSQL + MongoDB** (без Redis) ✅
- Обсяг: **каркас + базова структура папок** ✅
- Назва проєкту: **OdoCheck** ✅
- Встановлення інструментів (якщо знадобиться глобально) — на диск **D** ✅
