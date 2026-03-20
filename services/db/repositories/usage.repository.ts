/**
 * Usage metering from event-derived aggregates (`ai_sessions`, `usage_events`).
 * Plan limits remain in `features/account/plan-config.ts`.
 */
import { and, count, eq, gte, sum } from "drizzle-orm";

import { db } from "@/db";
import { aiSession } from "@/db/schema";

export type UsageSnapshot = {
  sessionsUsed: number;
  tokensUsed: number;
};

function rolling30dStart(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

export async function getUsageForUser(userId: string): Promise<UsageSnapshot> {
  try {
    const since = rolling30dStart();
    const [row] = await db
      .select({
        sessions: count(),
        tokens: sum(aiSession.tokensUsed),
      })
      .from(aiSession)
      .where(and(eq(aiSession.userId, userId), gte(aiSession.startedAt, since)));

    const sessionsUsed = Number(row?.sessions ?? 0);
    const tokensUsed = Number(row?.tokens ?? 0);
    return { sessionsUsed, tokensUsed };
  } catch {
    return { sessionsUsed: 0, tokensUsed: 0 };
  }
}
