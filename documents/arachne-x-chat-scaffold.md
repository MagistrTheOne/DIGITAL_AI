# ARACHNE-X — каркас чата (транскрипт + thinking)

## UI

- Панель **Transcript** на `/employees/[id]`: пузыри user / assistant.
- У assistant опционально **`thinking`** → сворачиваемый блок **«Thought for a moment»** (`ThinkingTrace` + Radix Collapsible), аналог цепочки рассуждения.
- Поле ввода блокируется на время хода (`transcriptBusy`).

## Код

| Часть | Назначение |
|--------|------------|
| `features/arachne-x/chatTurn.ts` | `runArachneXChatTurn(input)` → `{ content, thinking?, meta? }`. Сейчас **заглушка**; заменить на `fetch('/api/arachne-x/chat', …)` и позже **SSE** для `content` по чанкам. |
| `components/employee-interaction/types.ts` | `InteractionMessage.thinking`, `status: streaming \| complete`. |
| `EmployeeInteractionPage` | Собирает `transcript`, вызывает `runArachneXChatTurn`, дописывает ответ ассистента. |

## Следующие шаги

1. Route Handler `POST /api/arachne-x/chat` (или WebSocket): прокси к реальному оркестратору, стриминг `content`.
2. При стриминге: обновлять последнее сообщение с `status: 'streaming'` и накапливать `content`.
3. Синхронизация с Anam: `talk()` / `sendUserMessage` по финальному или по чанкам — отдельный контракт.

См. также [`arachne-x-ultra-modes.md`](./arachne-x-ultra-modes.md).
