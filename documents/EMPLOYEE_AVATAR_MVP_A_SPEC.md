# Спецификация MVP-A: `employees.config`, воркер аватара, контракты

Документ для согласования типов, API, окружения и UX до правок кода и миграций.  
**Текущее состояние в репозитории:** `EmployeeConfigJson` в `services/db/repositories/employees.repository.ts` — минимальный набор (`prompt`, `capabilities`, `avatarPlaceholder`, `videoPreviewUrl`). Ниже — **целевой контракт MVP-A**; после утверждения тип и миграции приводятся к нему.

---

## 3. Схема данных (`employees.config` и связанное)

### 3.1. Drizzle / Postgres

Фрагмент модели (уже в `db/schema.ts`):

```ts
// employees.config — JSONB, без отдельной миграции схемы JSON в Postgres.
// Семантика полей задаётся приложением + воркером (см. §3.2).
config: jsonb("config").notNull().default(sql`'{}'::jsonb`),
```

Индексация внутри JSONB для MVP-A не обязательна; при росте нагрузки — GIN на выбранные ключи или вынесение `job_id` в колонку.

### 3.2. TypeScript: целевой `EmployeeConfigJson` (MVP-A)

```ts
/** Статус подготовки ассета аватара (T2I / референс / пайплайн до видео). */
export type AvatarAssetStatus = "pending" | "ready" | "failed";

/** Одна запись демо-ответа (видео + метаданные job). */
export type EmployeeDemoReply = {
  jobId: string;
  status: "queued" | "running" | "ready" | "failed";
  /** Публичный URL MP4/WebM после готовности (или signed URL). */
  videoUrl?: string;
  /** Краткий текст запроса пользователя (для истории в UI). */
  promptSnippet?: string;
  createdAt: string; // ISO-8601
  updatedAt?: string;
  error?: string;
};

/**
 * Полный контракт JSON в `employees.config`.
 * Писатели: Next.js (Server Actions / API routes), фоновый worker (HTTP callback или прямой DB).
 */
export type EmployeeConfigJson = {
  // --- Существующие поля (wizard + чат) ---
  /** Системный / behavior prompt для LLM. */
  prompt?: string;
  capabilities?: string[];
  /** Текстовая заглушка / описание до готового аватара. */
  avatarPlaceholder?: string | null;
  /** Legacy: превью с ARACHNE или ранний URL; можно маппить в avatar после миграции. */
  videoPreviewUrl?: string | null;

  // --- MVP-A: референс изображения ---
  /** Публичный URL референса (если хранится вне object storage). */
  avatarRefImageUrl?: string | null;
  /** Ключ объекта в bucket (предпочтительно для продакшена). */
  avatarRefImageKey?: string | null;

  // --- MVP-A: статус подготовки ассета ---
  avatarAssetStatus?: AvatarAssetStatus;
  /** Сообщение для UI при failed (без секретов и стеков в проде — краткий код + message). */
  avatarAssetError?: string | null;

  // --- MVP-A: демо-видео (ответы) ---
  /** Последний успешный демо-ролик (удобно для карточки на /ai-digital). */
  lastDemoVideoUrl?: string | null;
  lastDemoJobId?: string | null;
  lastDemoStatus?: EmployeeDemoReply["status"];
  /** История демо (опционально; лимитировать длину массива на уровне приложения, напр. 20). */
  demoReplies?: EmployeeDemoReply[];
};
```

### 3.3. Пример JSON (без секретов)

**После создания сотрудника (wizard), до mint:**

```json
{
  "prompt": "You are a concise CFO assistant for SMB owners.",
  "capabilities": ["reports", "forecasting"],
  "avatarPlaceholder": "Professional portrait, navy blazer",
  "avatarAssetStatus": "pending"
}
```

**После загрузки референса в storage, до инференса:**

```json
{
  "prompt": "You are a concise CFO assistant for SMB owners.",
  "capabilities": ["reports", "forecasting"],
  "avatarPlaceholder": "Professional portrait, navy blazer",
  "avatarRefImageKey": "tenants/acme/employees/emp_abc123/ref/input.jpg",
  "avatarAssetStatus": "pending"
}
```

**После успешного mint / подготовки превью:**

```json
{
  "prompt": "You are a concise CFO assistant for SMB owners.",
  "capabilities": ["reports", "forecasting"],
  "avatarRefImageKey": "tenants/acme/employees/emp_abc123/ref/input.jpg",
  "avatarAssetStatus": "ready",
  "videoPreviewUrl": "https://cdn.example.com/preview/emp_abc123.mp4",
  "lastDemoStatus": "ready",
  "lastDemoVideoUrl": "https://cdn.example.com/demo/emp_abc123_latest.mp4",
  "lastDemoJobId": "job_demo_01HZ",
  "demoReplies": [
    {
      "jobId": "job_demo_01HZ",
      "status": "ready",
      "videoUrl": "https://cdn.example.com/demo/emp_abc123_latest.mp4",
      "promptSnippet": "Explain Q3 burn in 20s",
      "createdAt": "2026-04-04T12:00:00.000Z",
      "updatedAt": "2026-04-04T12:02:15.000Z"
    }
  ]
}
```

**Ошибка пайплайна:**

```json
{
  "avatarAssetStatus": "failed",
  "avatarAssetError": "INFER_TIMEOUT: video encode exceeded 120s"
}
```

### 3.4. Правила обновления (кто пишет)

| Поле / группа | Пишет App (Next) | Пишет Worker | Примечание |
|----------------|------------------|--------------|------------|
| `prompt`, `capabilities`, `avatarPlaceholder` | ✅ (wizard, settings) | ❌ | Источник истины — продукт. |
| `avatarRefImageUrl` / `avatarRefImageKey` | ✅ после upload | ❌ | Ключ выдаёт presigned flow в app. |
| `avatarAssetStatus`, `avatarAssetError` | ✅ (сброс в `pending` при новом job) | ✅ (прогресс `ready` / `failed`) | Идемпотентность по `jobId` (§4). |
| `videoPreviewUrl` | ✅ legacy | ✅ может обновить worker | Свести к одному семантическому полю после миграции. |
| `lastDemo*`, `demoReplies[]` | ✅ постановка job (статус `queued`) | ✅ обновление статусов / URL | App добавляет элемент; worker патчит по `jobId`. |

**Рекомендация:** worker не делает полной перезаписи `config`, а **merge** на уровне приложения: `UPDATE` читает JSON, мержит ключи, пишет обратно (или отдельная RPC `patch_employee_config(employee_id, patch jsonb)`).

---

## 4. Контракты API / очереди

### 4.1. Таблица операций (черновик для реализации)

| Вызывающий | Действие | Вход | Выход |
|------------|----------|------|--------|
| App (Server Action / Route Handler) | Поставить задачу **mint** (превью / первичный ассет) | `employeeId`, `userId` (из сессии), опционально `promptHint` для T2I, `idempotencyKey?` | `{ jobId: string }` или `{ error }` |
| App | Поставить задачу **demo-reply** | `employeeId`, `text` или `messageId`, `idempotencyKey?` | `{ jobId: string }` |
| Worker | Обновить БД по завершении job | Внутренний вызов: `employeeId`, `jobId`, patch для `config` | HTTP 200 + `{ ok: true }` |
| App | Poll статуса (опционально, если нет webhook) | `jobId` | `{ status, videoUrl? }` |

Транспорт MVP-A (выбрать один и зафиксировать в репо):

- **A)** Очередь (Redis / SQS / Cloud Tasks) + worker consumer.  
- **B)** HTTP `POST` из App на воркер + worker пишет в БД; App только ставит задачу.  
- **C)** Таблица `jobs` в Postgres + worker polling.

### 4.2. Аутентификация App ↔ Worker

**Предложение (зафиксировать в `.env.example`):**

- Общий секрет **`WORKER_INGRESS_SECRET`** (или `NULLXES_WORKER_SERVICE_KEY`): заголовок `X-NULLXES-Worker-Secret` на входящие запросы к воркеру от App.  
- Обратный канал Worker → App (если нужен webhook вместо прямого DB): **`WORKER_CALLBACK_SECRET`** + HMAC подпись тела или JWT с коротким TTL.

**Альтернатива:** только private network (VPC) + без секрета — допустимо в одном кластере, но для Vercel + внешний worker секрет обязателен.

### 4.3. Идемпотентность

- Клиент и App передают **`Idempotency-Key`** (UUID) на mint/demo; воркер хранит последний успешный результат по `(employeeId, action, idempotencyKey)`.  
- Повторный запрос с тем же ключом возвращает тот же `jobId` без дублирования GPU-задачи.

### 4.4. Таймауты и retry

| Этап | Рекомендуемый таймаут | Retry |
|------|------------------------|--------|
| Постановка в очередь | 5–10 s | 1–2 раза с backoff |
| Инференс (T2I / I2V / TTS) | 120–300 s (настраиваемо) | Не retry всего job автоматически; пометить `failed`, опционально dead-letter |
| Запись в БД из worker | 10 s | 3× exponential backoff |

---

## 5. Модели и версии (воспроизводимость)

Зафиксировать в репозитории воркера отдельным `MODELS.lock.md` или в этом разделе после первого успешного прогона.

| Компонент | Источник | Что зафиксировать |
|-----------|----------|-------------------|
| **Z-Image-Turbo** | Hugging Face / Docker | Model id (`org/name`), revision git SHA, Docker image digest, commit репозитория инференса |
| **OmniVoice** | [k2-fsa/OmniVoice](https://huggingface.co/k2-fsa/OmniVoice) | Ревизия весов на HF, sample rate выхода, скрипт запуска, batch size |
| **V-Express** | [tk93/V-Express](https://huggingface.co/tk93/V-Express) | Обязательные `.bin` / checkpoints, разрешение входного кадра, длительность клипа, формат аудио (WAV 16 kHz / 24 kHz и т.д.) |

**«Золотой» e2e прогон (шаблон):**

```bash
# Пример каркаса — подставить реальные команды после стабилизации воркера
docker compose -f worker/docker-compose.golden.yml run --rm inference \
  --employee-id emp_test_001 \
  --ref-image ./fixtures/ref.jpg \
  --script ./fixtures/demo_script.txt \
  --out ./out/golden.mp4
# Ожидание: валидный MP4, длительность ≤ N сек, отсутствие артефактов в первых/последних кадрах
```

---

## 6. Окружение и секреты (имена, без значений)

### Next.js (этот репозиторий)

- `DATABASE_URL`  
- `BETTER_AUTH_*`, `NEXT_PUBLIC_BETTER_AUTH_URL` (уже используются)  
- `POLAR_*` (биллинг)  
- `OPENAI_*`, `ARACHNE_*`, `NULLXES_*` (уже используются)  
- **Новые для MVP-A (пример):**  
  - `WORKER_MINT_URL` — base URL HTTP воркера для постановки mint  
  - `WORKER_DEMO_URL` — base URL для demo job  
  - `WORKER_INGRESS_SECRET` — секрет App → Worker  
  - `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` **или** `S3_*` аналоги  
  - `AVATAR_UPLOAD_MAX_BYTES`  
  - `HF_TOKEN` — если модели gated  

### Worker (отдельный репозиторий / сервис)

- `DATABASE_URL` (если worker пишет в ту же БД) **или** только HTTP callback в App  
- `HF_TOKEN`  
- `CUDA_VISIBLE_DEVICES` / пути к весам  
- `WORKER_CALLBACK_SECRET` (если worker дергает App)  
- Те же storage ключи, если worker сам заливает в bucket  

Файл **`.env.example`** в приложении и в воркере — только имена и комментарии, без реальных ключей (как в текущем шаблоне репозитория).

---

## 7. UX и состояния UI

Решения для согласования с дизайном (пока без Figma — текстовый контракт).

| Состояние | `/ai-digital` (карточка сотрудника) | Страница взаимодействия |
|-----------|-------------------------------------|-------------------------|
| `avatarAssetStatus === "pending"` | Скелетон / blur + `avatarPlaceholder` текст; бейдж «Готовим аватар» | То же; чат **можно** открыть, если продуктово разрешено без видео |
| `avatarAssetStatus === "failed"` | Иконка ошибки + короткий `avatarAssetError`; кнопка «Повторить» | **Предложение:** не блокировать текстовый чат; видео-демо disabled до исправления |
| Демо-видео | Показывать **`lastDemoVideoUrl`** как превью; опционально chip «Последний демо» | История: либо только последний ролик (MVP), либо список из `demoReplies` (фаза 2) |

**Нужно от продукта:** один экран-референс (Figma или скрин) для карточки в трёх состояниях: pending / ready / failed.

---

## 8. Мобилка

| Вопрос | Решение MVP (заполнить) |
|--------|-------------------------|
| Стек | ☐ React Native ☐ Flutter ☐ WebView поверх Next ☐ Натив |
| Автовоспроизведение видео | ☐ Требуется явный tap (iOS) ☐ Inline muted autoplay |

**Рекомендация для быстрого MVP:** WebView на `/ai-digital` + те же URL; учесть политики autoplay для превью MP4.

---

## 9. Следующая фаза (Pipecat / realtime)

Заранее зафиксировать направление:

- Транспорт: **Daily** / **LiveKit** / сырой **WebSocket** (как сейчас ARACHNE).  
- OmniVoice в live: **тот же** движок vs **streaming TTS** (отдельная модель).  
- **Barge-in:** требуется ли прерывание TTS при начале речи пользователя; задержка SLA (мс).

---

## 10. Чеклист «можно начинать кодить»

- [ ] Утверждён пример `employees.config` до/после mint и после demo job (§3.3).  
- [ ] Описан контракт постановки задач (HTTP vs очередь) и таблица §4.1 внедрена в код/README воркера.  
- [ ] Выбран storage (R2/S3), политика **signed URL** (TTL, права read-only).  
- [ ] Зафиксированы версии моделей + один рабочий e2e скрипт / `docker compose` (§5).  
- [ ] Понятна топология: где деплоится Next app относительно worker (один VPC / публичные URL + секреты).  
- [ ] Обновлены `EmployeeConfigJson` в TypeScript и при необходимости миграция документации Drizzle.  
- [ ] `.env.example` (app + worker) синхронизированы с §6.

---

*Версия документа: 2026-04-04. После утверждения полей — внести изменения в `employees.repository.ts` (`EmployeeConfigJson`) и при необходимости добавить OpenAPI-заготовку для worker в `documents/` или `worker/openapi.yaml`.*
