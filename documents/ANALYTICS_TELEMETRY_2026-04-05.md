# Analytics telemetry: writes, reads, and KPI mapping

This note ties the analytics dashboard and **plan usage** to Postgres tables `ai_sessions` and `usage_events`. It complements billing (Polar) and is not a financial audit trail.

## Write paths

### OpenAI transcript (HTTP)

- **Route:** `POST /api/employees/chat`
- **When:** After each chat turn completes (success or failure), if the client sent `clientChatSessionId`.
- **Function:** `recordChatTurnTelemetry` in `services/db/repositories/telemetry.repository.ts`
- **Channel:** `openai` (default) → `usage_events.event_type` is `openai.chat.turn` or `openai.chat.error`.
- **Session id:** Client-supplied OpenAI transcript session id (localStorage) → `ai_sessions.id`.
- **Employee:** Each `usage_events` row includes `employee_id` (for per-agent rollups). Apply migration `drizzle/0006_usage_events_employee_id.sql` on existing databases.

### ARACHNE-X WebSocket transcript

- **Route:** `POST /api/employees/telemetry/chat-turn`
- **When:** Browser receives `chat.message.received` from `assistant` after a user `sendChat`, or `session.error` while a send is pending.
- **Function:** Same `recordChatTurnTelemetry` with `channel: "arachne"`.
- **Event types:** `arachne.chat.turn` / `arachne.chat.error`.
- **Session id:** `nx_ws_{bootstrap.sessionId}`.

### Cost saved column

- **Field:** `ai_sessions.cost_saved_cents` — incremented on conflict for the same `id`.
- **Formula:** `lib/analytics/cost-saved.server.ts` — per successful turn: fixed cents (env) plus token-based cents from `ANALYTICS_COST_SAVED_USD_PER_1K_TOKENS` × `tokensDelta`. Failed turns add `0`.
- **Env:** `.env.example` (`ANALYTICS_COST_SAVED_FIXED_CENTS_PER_SUCCESS_TURN`, `ANALYTICS_COST_SAVED_USD_PER_1K_TOKENS`).

## Read path

- **BFF:** `getAnalyticsDashboardDTO` → `services/db/repositories/analytics.repository.ts`.
- **Plan usage (caps):** `getUsageForUser` in `services/db/repositories/usage.repository.ts` — **successful chat turns** (count of `usage_events` with `openai.chat.turn` or `arachne.chat.turn`) plus **tokens** = `sum(ai_sessions.tokens_used)` over 30d.

## KPI mapping (30d rolling unless noted)

| UI / metric | Source |
|-------------|--------|
| Cost saved | `sum(ai_sessions.cost_saved_cents)` / 100, last 30d |
| Transcript sessions (KPI card) | `count(*)` on `ai_sessions` in window (one row per client transcript id) |
| Avg response time | `avg(latency_ms)` on those `ai_sessions` rows |
| Turn success rate | `usage_events`: successful turn types / all turn outcome types (`openai` + `arachne` turn + error), same window |
| Efficiency gain | `clamp(turn_success_rate - ANALYTICS_BASELINE_SUCCESS_PCT, 0, 100)` (default baseline 85) |
| Card “vs prior 30d” | Prior window `[now-60d, now-30d)` vs current `[now-30d, now)` |
| Per-employee success | `usage_events` grouped by `employee_id` (turn success formula); transcript count + avg latency from `ai_sessions` by `employee_id` |
| Timeline (24h) | `ai_sessions.started_at` bucketed by hour |
| Turn success (1h, live panel) | Same turn formula on `usage_events.created_at` in last hour; **null** if no turn events |
| Active sessions | Open `ai_sessions` (`ended_at` null) with `updated_at` within TTL (15m) |
| Events/sec | `usage_events` count in last 60s / 60 |
| Plan “Chat turns” cap | Count of successful turn events (rolling 30d) vs `PLANS.*.limits.sessions` in `features/account/plan-config.ts` |

## Auth email (production)

- **File:** `lib/auth.ts` — password reset and email OTP use Resend when `RESEND_API_KEY` is set; `EMAIL_FROM` should use a verified domain in production.
- **Development:** Without `RESEND_API_KEY`, messages are logged to the server console.
- **Production:** Missing `RESEND_API_KEY` throws when sending mail (sign-up verification / reset).

## Unused rollup

- **`ai_metrics_daily`** exists in `db/schema.ts` but is not written in this repo; optional future rollup for heavier dashboards.
