/**
 * Best-effort client telemetry for ARACHNE-X WebSocket turns (mirrors OpenAI POST chat path).
 */
export async function postArachneChatTurnTelemetry(input: {
  employeeId: string;
  clientSessionId: string;
  latencyMs: number;
  success: boolean;
  tokensDelta?: number;
}): Promise<void> {
  try {
    await fetch("/api/employees/telemetry/chat-turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: input.employeeId,
        clientSessionId: input.clientSessionId,
        latencyMs: input.latencyMs,
        success: input.success,
        tokensDelta: input.tokensDelta ?? 0,
      }),
    });
  } catch {
    /* non-blocking */
  }
}
