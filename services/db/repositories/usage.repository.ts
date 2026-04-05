/**
 * Usage metering aligned with plan limits: successful chat turns + token totals.
 * Plan limits live in `features/account/plan-config.ts`.
 */
import { and, count, eq, gte, inArray, sum } from "drizzle-orm";

import { db } from "@/db";
import { aiSession, usageEvent } from "@/db/schema";
import { CHAT_TURN_SUCCESS_EVENT_TYPES } from "@/services/db/repositories/telemetry.repository";

export type UsageSnapshot = {
  /** Successful chat turns in rolling window (matches plan `sessions` cap). */
  sessionsUsed: number;
  tokensUsed: number;
};

function rolling30dStart(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

export async function getUsageForUser(userId: string): Promise<UsageSnapshot> {
  try {
    const since = rolling30dStart();
    const [turnRow] = await db
      .select({ c: count() })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.userId, userId),
          gte(usageEvent.createdAt, since),
          inArray(usageEvent.eventType, [...CHAT_TURN_SUCCESS_EVENT_TYPES]),
        ),
      );

    const [tokRow] = await db
      .select({
        tokens: sum(aiSession.tokensUsed),
      })
      .from(aiSession)
      .where(and(eq(aiSession.userId, userId), gte(aiSession.startedAt, since)));

    return {
      sessionsUsed: Number(turnRow?.c ?? 0),
      tokensUsed: Number(tokRow?.tokens ?? 0),
    };
  } catch {
    return { sessionsUsed: 0, tokensUsed: 0 };
  }
}
