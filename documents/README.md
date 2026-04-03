# D_SAAS / dashboard — документация (`dai_saas`)

Точка входа для интеграции с оркестратором и realtime-слоем:

- **[ARACHNE-X ↔ D_SAAS (dashboard): контракт интеграции](./ARACHNE-X-dashboard-integration-contract.md)** — провод (HTTP token, WebSocket, события), env, связь с внешним platform-backend vs UI; в конце документа — таблица **реализации линии B** в этом репозитории.

Прочее по продукту:

- **Backlog (enterprise):** экспорт или снимок дашборда `/analytics` (CSV/PDF) либо read-only ссылка для финансов — в порядке блоков: usage → ROI → SLA-метрики (отдельная задача после текущего UI).

- [Arachne-X: каркас чата](./arachne-x-chat-scaffold.md)
- [Arachne-X: ultra modes](./arachne-x-ultra-modes.md)

Копии для монорепо NULLXES могут дублироваться в **`Documentation/D_SAAS/`** (репозиторий ARACHNE-X); материалы **JobAI pilot** живут отдельно в том дереве, не в `dai_saas`.
