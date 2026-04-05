/**
 * Writes chat turn telemetry into `usage_events` + `ai_sessions` (analytics read path).
 */
import { and, eq, sql } from "drizzle-orm";

import { computeCostSavedCentsForTurn } from "@/lib/analytics/cost-saved.server";
import { db } from "@/db";
import { aiSession, usageEvent } from "@/db/schema";

export const USAGE_EVENT_CHAT_TURN = "openai.chat.turn";
export const USAGE_EVENT_CHAT_ERROR = "openai.chat.error";
export const USAGE_EVENT_ARACHNE_CHAT_TURN = "arachne.chat.turn";
export const USAGE_EVENT_ARACHNE_CHAT_ERROR = "arachne.chat.error";

/** Successful chat turns (for usage caps + success rate). */
export const CHAT_TURN_SUCCESS_EVENT_TYPES = [
  USAGE_EVENT_CHAT_TURN,
  USAGE_EVENT_ARACHNE_CHAT_TURN,
] as const;

/** All chat turn outcomes including errors. */
export const CHAT_TURN_ALL_EVENT_TYPES = [
  USAGE_EVENT_CHAT_TURN,
  USAGE_EVENT_ARACHNE_CHAT_TURN,
  USAGE_EVENT_CHAT_ERROR,
  USAGE_EVENT_ARACHNE_CHAT_ERROR,
] as const;

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
  /** Default `openai` — ARACHNE WebSocket turns use `arachne` for `usage_events` typing. */
  channel?: "openai" | "arachne";
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
    channel = "openai",
  } = input;

  const eventType = success
    ? channel === "arachne"
      ? USAGE_EVENT_ARACHNE_CHAT_TURN
      : USAGE_EVENT_CHAT_TURN
    : channel === "arachne"
      ? USAGE_EVENT_ARACHNE_CHAT_ERROR
      : USAGE_EVENT_CHAT_ERROR;
  const quantity = success ? Math.max(1, tokensDelta) : 1;

  const now = new Date();
  const tokensAdd = success ? Math.max(0, tokensDelta) : 0;
  const costDelta = computeCostSavedCentsForTurn({ success, tokensDelta });

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
      costSavedCents: costDelta,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: aiSession.id,
      set: {
        latencyMs,
        success,
        tokensUsed: sql`${aiSession.tokensUsed} + ${tokensAdd}`,
        costSavedCents: sql`${aiSession.costSavedCents} + ${costDelta}`,
        updatedAt: now,
      },
    });

  await db.insert(usageEvent).values({
    id: newEventId(),
    userId,
    sessionId: clientSessionId,
    employeeId,
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
