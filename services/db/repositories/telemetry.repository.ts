/**
 * Writes chat turn telemetry into `usage_events` + `ai_sessions` (analytics read path).
 */
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { aiSession, usageEvent } from "@/db/schema";

export const USAGE_EVENT_CHAT_TURN = "openai.chat.turn";
export const USAGE_EVENT_CHAT_ERROR = "openai.chat.error";

function newEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export type RecordChatTurnTelemetryInput = {
  userId: string;
  employeeId: string;
  clientSessionId: string;
  latencyMs: number;
  tokensDelta: number;
  success: boolean;
};

/**
 * Inserts a usage row and upserts `ai_sessions` keyed by `clientSessionId` (OpenAI transcript tab id).
 */
export async function recordChatTurnTelemetry(
  input: RecordChatTurnTelemetryInput,
): Promise<void> {
  const {
    userId,
    employeeId,
    clientSessionId,
    latencyMs,
    tokensDelta,
    success,
  } = input;

  const eventType = success ? USAGE_EVENT_CHAT_TURN : USAGE_EVENT_CHAT_ERROR;
  const quantity = success ? Math.max(1, tokensDelta) : 1;

  const now = new Date();
  const tokensAdd = success ? Math.max(0, tokensDelta) : 0;

  await db
    .insert(aiSession)
    .values({
      id: clientSessionId,
      userId,
      employeeId,
      startedAt: now,
      endedAt: null,
      latencyMs,
      success,
      tokensUsed: tokensAdd,
      costSavedCents: 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: aiSession.id,
      set: {
        latencyMs,
        success,
        tokensUsed: sql`${aiSession.tokensUsed} + ${tokensAdd}`,
        updatedAt: now,
      },
    });

  await db.insert(usageEvent).values({
    id: newEventId(),
    userId,
    sessionId: clientSessionId,
    eventType,
    quantity,
  });
}

export async function endAiWorkspaceSession(
  userId: string,
  clientSessionId: string,
): Promise<void> {
  const now = new Date();
  await db
    .update(aiSession)
    .set({ endedAt: now, updatedAt: now })
    .where(
      and(eq(aiSession.id, clientSessionId), eq(aiSession.userId, userId)),
    );
}
