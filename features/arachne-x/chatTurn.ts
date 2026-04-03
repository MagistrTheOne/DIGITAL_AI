/**
 * ARACHNE-X — локальная заглушка чат-хода (dev / демо без бэка).
 *
 * Для продукта с ARACHNE-X (линия B, MVP): основной канал чата — **WebSocket**
 * (`chat.send` / `chat.message.received`), см. `EmployeeInteractionPage` + `WebSocketTransport`.
 * **Не** подключать `POST /v1/chat` из UI, пока продукт явно не запросит второй канал.
 */

export type ArachneChatTurnInput = {
  employeeId: string;
  displayName: string;
  userMessage: string;
  /** Уже показанный транскрипт (без черновика текущего сообщения). */
  transcript: { role: "user" | "assistant"; content: string }[];
};

export type ArachneChatTurnResult = {
  content: string;
  /** Расшифровка «рассуждения» / trace оркестратора — показываем сворачиваемым блоком. */
  thinking?: string;
  /** Расширение: citations, tool_calls, latencyMs, modelId, … */
  meta?: Record<string, unknown>;
};

/**
 * Заглушка: имитирует задержку сети и возвращает thinking + ответ.
 * Реальный поток: тот же контракт, но `content` может накапливаться по чанкам (см. types в transcript).
 */
export async function runArachneXChatTurn(
  input: ArachneChatTurnInput,
): Promise<ArachneChatTurnResult> {
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 400));

  const q = input.userMessage.trim().toLowerCase();
  let thinking =
    "Mapping user intent to employee context and policy-safe reply templates. " +
    `Orchestrator: ARACHNE-X (stub) · employee: ${input.displayName}.`;

  let content =
    "This is a **local scaffold** response. Wire `runArachneXChatTurn` to your ARACHNE-X endpoint for streaming tokens, tools, and voice sync.";

  if (/\bnullx|arachne|company|who are you\b/i.test(input.userMessage)) {
    thinking =
      "Retrieving brand context: NULLXES digital workforce platform, ARACHNE-X as core engine, enterprise workflows — stub knowledge.";
    content =
      "**NULLXES** is a technology company building a unified **digital workforce** platform. Our core engine **ARACHNE-X** powers autonomous digital employees that work across **voice, text, and video**, execute tasks, and plug into enterprise workflows in near real time — a scalable 24/7 layer that complements human teams.";
  }

  return {
    thinking,
    content,
    meta: { stub: true, at: Date.now() },
  };
}
