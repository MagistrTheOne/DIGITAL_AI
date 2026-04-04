/**
 * Client hooks for `ai_sessions` lifecycle (analytics active count).
 */
export function postEndAiWorkspaceSession(clientChatSessionId: string) {
  if (typeof window === "undefined" || !clientChatSessionId.trim()) return;
  void fetch("/api/employees/analytics/session/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientChatSessionId }),
    keepalive: true,
  }).catch(() => {});
}
