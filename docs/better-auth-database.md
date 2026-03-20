# Better Auth + Drizzle + Neon

Серверная конфигурация: [`lib/auth.ts`](../lib/auth.ts) — `drizzleAdapter` + `emailAndPassword`, опционально Google OAuth (если заданы `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`), плагины `dash` и `emailOTP`.

## Миграции БД

`npx auth migrate` из [документации Better Auth](https://www.better-auth.com/docs/concepts/database#running-migrations) применим к **встроенному Kysely-адаптеру**. С **Drizzle** таблицы создаются через **Drizzle Kit** или готовый SQL.

### Вариант A — SQL в Neon (рекомендуется после смены схемы)

1. Открой **Neon → SQL Editor**.
2. Выполни содержимое файла [`drizzle/0001_better-auth.sql`](../drizzle/0001_better-auth.sql)  
   (удаляет старую таблицу `users` из `0000_init-users` и создаёт `user`, `session`, `account`, `verification`).

Или из терминала (с `DATABASE_URL` в окружении):

```bash
psql "$DATABASE_URL" -f drizzle/0001_better-auth.sql
```

### Вариант B — Drizzle Kit (локально, интерактивно)

Когда снимок миграций синхронизирован со схемой, можно использовать:

```bash
npm run db:generate   # drizzle-kit generate
npm run db:migrate    # drizzle-kit migrate
```

При конфликте со старой таблицей `users` удобнее сначала применить **вариант A**, затем при необходимости пересобрать снимки.

### Генерация схемы из CLI Better Auth (опционально)

```bash
npm run db:auth:generate
```

Команда вызывает `npx auth@latest generate` с `--config lib/auth.ts`. При ошибках импорта замените алиасы на относительные пути в конфиге (см. [CLI — Common Issues](https://www.better-auth.com/docs/concepts/cli#common-issues)).

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | Neon Postgres |
| `BETTER_AUTH_SECRET` | ≥ 32 символов ([installation](https://www.better-auth.com/docs/installation)) |
| `BETTER_AUTH_URL` | Базовый URL приложения |
| `BETTER_AUTH_API_KEY` | Для плагина Dash (`@better-auth/infra`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Опционально, Google OAuth |
