# Analytics telemetry: writes, reads, and KPI mapping

This note ties the analytics dashboard to Postgres tables `ai_sessions` and `usage_events`. It complements billing (Polar) and is not a financial audit trail.

## Write paths

### OpenAI transcript (HTTP)

- **Route:** `POST /api/employees/chat`
- **When:** After each chat turn completes (success or failure), if the client sent `clientChatSessionId`.
- **Function:** `recordChatTurnTelemetry` in `services/db/repositories/telemetry.repository.ts`
- **Channel:** `openai` (default) → `usage_events.type` is `openai.chat.turn` or `openai.chat.error`.
- **Session id:** Client-supplied OpenAI transcript session id (localStorage) → `ai_sessions.id`.

### ARACHNE-X WebSocket transcript

- **Route:** `POST /api/employees/telemetry/chat-turn` (authenticated; employee must belong to user).
- **When:** Browser receives `chat.message.received` from `assistant` after a user `sendChat`, or `session.error` while a send is pending.
- **Function:** Same `recordChatTurnTelemetry` with `channel: "arachne"`.
- **Event types:** `arachne.chat.turn` / `arachne.chat.error` in `usage_events`.
- **Session id:** `nx_ws_{bootstrap.sessionId}` so turns aggregate per realtime session.

### Cost saved column

- **Field:** `ai_sessions.cost_saved_cents` — incremented on conflict for the same `id`.
- **Formula:** `lib/analytics/cost-saved.server.ts` — per successful turn: fixed cents (env) plus token-based cents from `ANALYTICS_COST_SAVED_USD_PER_1K_TOKENS` × `tokensDelta`. Failed turns add `0`.
- **Env:** See `.env.example` (`ANALYTICS_COST_SAVED_FIXED_CENTS_PER_SUCCESS_TURN`, `ANALYTICS_COST_SAVED_USD_PER_1K_TOKENS`).

## Read path

- **BFF:** `getAnalyticsDashboardDTO` → `services/db/repositories/analytics.repository.ts`.
- **Tables:** Primarily `ai_sessions` (KPIs, timeline, employee rollups, last-hour health). `usage_events` drives **events/sec** in realtime stats (60s rolling count / 60).

## KPI mapping (30d rolling unless noted)

| UI / metric | Source |
|-------------|--------|
| Cost saved | `sum(ai_sessions.cost_saved_cents)` / 100, last 30d |
| Sessions handled | `count(*)` on `ai_sessions`, last 30d |
| Avg response time | `avg(latency_ms)`, last 30d |
| Success rate | Among rows with `ended_at IS NOT NULL`: `success` count / finished count |
| Efficiency gain | `clamp(success_rate - 85%, 0, 100)` (heuristic baseline) |
| Card “vs prior 30d” | Same aggregates on window `[now-60d, now-30d)` vs `[now-30d, now)` |
| Timeline (24h) | Session starts bucketed by hour |
| Turn success (1h) | `success` / total for `started_at` in last hour; **null** if no rows |
| Active sessions | Open rows (`ended_at` null) with `updated_at` within TTL (15m) |
| Events/sec | `usage_events` count in last 60s / 60 |

## Unused rollup

- **`ai_metrics_daily`** exists in `db/schema.ts` but is not written in this repo; optional future rollup for heavier dashboards.
