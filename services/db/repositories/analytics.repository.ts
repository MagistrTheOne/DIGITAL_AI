/**
 * Analytics aggregates — telemetry from `ai_sessions` + `usage_events`.
 */
import { and, count, eq, gte, isNull, lt, sql } from "drizzle-orm";

/** Open `ai_sessions` rows without `ended_at` older than this are not counted as active. */
const ACTIVE_SESSION_TTL_MS = 15 * 60 * 1000;

function activeSessionSince(): Date {
  return new Date(Date.now() - ACTIVE_SESSION_TTL_MS);
}

import { db } from "@/db";
import { aiSession, usageEvent } from "@/db/schema";
import { listEmployeesByQuery } from "@/services/db/repositories/employees.repository";
import { getUsageForUser } from "@/services/db/repositories/usage.repository";

import type { EmployeeListQuery } from "@/features/employees/types";

const BASELINE_SUCCESS_PCT = 85;

function rolling30dStart(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

function rolling60dStart(): Date {
  return new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
}

function rolling24hStart(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

function rolling60sStart(): Date {
  return new Date(Date.now() - 60 * 1000);
}

function rolling1hStart(): Date {
  return new Date(Date.now() - 60 * 60 * 1000);
}

export type KpiMetricsRecord = {
  sessionsHandled: number;
  avgLatencyMs: number;
  successRatePct: number;
  costSavedUsd: number;
  efficiencyGainPct: number;
  /** % change vs prior 30d; null when prior window has no comparable baseline. */
  costSavedTrendPct: number | null;
  sessionsTrendPct: number | null;
  /** Current avg latency minus prior-30d avg; null when either window has no sessions. */
  latencyTrendMs: number | null;
  /** Efficiency (success vs baseline) change vs prior 30d, percentage points. */
  efficiencyTrendPts: number | null;
};

export type EmployeePerformanceRecord = {
  employeeId: string;
  name: string;
  sessions: number;
  successRatePct: number;
  avgLatencyMs: number;
  status: "active" | "idle" | "error";
};

export type RealtimeStatsRecord = {
  activeSessions: number;
  eventsPerSecond: number;
  /** Last-hour turn success rate; null when no turns in that window. */
  streamHealthPct: number | null;
};

export type TimelineHourRecord = {
  hourIndex: number;
  sessionsCount: number;
};

function efficiencyFromSuccessRate(successRatePct: number): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((successRatePct - BASELINE_SUCCESS_PCT) * 10) / 10,
    ),
  );
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

async function aggregateKpiWindow(
  userId: string,
  sinceInclusive: Date,
  untilExclusive?: Date,
): Promise<{
  sessionsHandled: number;
  avgLatencyMs: number;
  successRatePct: number;
  costSavedUsd: number;
}> {
  const conds = [
    eq(aiSession.userId, userId),
    gte(aiSession.startedAt, sinceInclusive),
  ];
  if (untilExclusive) {
    conds.push(lt(aiSession.startedAt, untilExclusive));
  }

  const [agg] = await db
    .select({
      sessions: sql<number>`count(*)::int`,
      avgLatency: sql<number>`coalesce(avg(${aiSession.latencyMs})::float, 0)`,
      successNum: sql<number>`coalesce(sum(case when ${aiSession.success} is true then 1 else 0 end)::int, 0)`,
      finished: sql<number>`coalesce(sum(case when ${aiSession.endedAt} is not null then 1 else 0 end)::int, 0)`,
      costCents: sql<number>`coalesce(sum(${aiSession.costSavedCents})::bigint, 0)::int`,
    })
    .from(aiSession)
    .where(and(...conds));

  const sessionsHandled = Number(agg?.sessions ?? 0);
  const avgLatencyMs = Math.round(Number(agg?.avgLatency ?? 0));
  const finished = Number(agg?.finished ?? 0);
  const successNum = Number(agg?.successNum ?? 0);
  const successRatePct =
    finished > 0 ? Math.round((successNum / finished) * 1000) / 10 : 0;
  const costSavedUsd = Number(agg?.costCents ?? 0) / 100;

  return {
    sessionsHandled,
    avgLatencyMs,
    successRatePct,
    costSavedUsd,
  };
}

export async function getKpiMetrics(userId: string): Promise<KpiMetricsRecord> {
  try {
    const since30 = rolling30dStart();
    const since60 = rolling60dStart();
    const [current, prior] = await Promise.all([
      aggregateKpiWindow(userId, since30),
      aggregateKpiWindow(userId, since60, since30),
    ]);

    const efficiencyGainPct = efficiencyFromSuccessRate(current.successRatePct);
    const priorEfficiency = efficiencyFromSuccessRate(prior.successRatePct);

    const latencyTrendMs =
      current.sessionsHandled > 0 && prior.sessionsHandled > 0
        ? current.avgLatencyMs - prior.avgLatencyMs
        : null;

    return {
      sessionsHandled: current.sessionsHandled,
      avgLatencyMs: current.avgLatencyMs,
      successRatePct: current.successRatePct,
      costSavedUsd: current.costSavedUsd,
      efficiencyGainPct,
      costSavedTrendPct: pctDelta(current.costSavedUsd, prior.costSavedUsd),
      sessionsTrendPct: pctDelta(current.sessionsHandled, prior.sessionsHandled),
      latencyTrendMs,
      efficiencyTrendPts:
        Math.round((efficiencyGainPct - priorEfficiency) * 10) / 10,
    };
  } catch {
    return {
      sessionsHandled: 0,
      avgLatencyMs: 0,
      successRatePct: 0,
      costSavedUsd: 0,
      efficiencyGainPct: 0,
      costSavedTrendPct: null,
      sessionsTrendPct: null,
      latencyTrendMs: null,
      efficiencyTrendPts: null,
    };
  }
}

export async function getEmployeePerformance(
  userId: string,
): Promise<EmployeePerformanceRecord[]> {
  try {
    const since = rolling30dStart();
    const rows = await db
      .select({
        employeeId: aiSession.employeeId,
        sessions: sql<number>`count(*)::int`,
        avgLatencyMs: sql<number>`coalesce(avg(${aiSession.latencyMs})::float, 0)`,
        successRatePct: sql<number>`
          (coalesce(sum(case when ${aiSession.success} is true then 1 else 0 end)::float, 0)
          / nullif(count(*)::float, 0)) * 100
        `,
      })
      .from(aiSession)
      .where(and(eq(aiSession.userId, userId), gte(aiSession.startedAt, since)))
      .groupBy(aiSession.employeeId);

    const open = await db
      .selectDistinct({ employeeId: aiSession.employeeId })
      .from(aiSession)
      .where(
        and(
          eq(aiSession.userId, userId),
          isNull(aiSession.endedAt),
          gte(aiSession.updatedAt, activeSessionSince()),
        ),
      );
    const activeSet = new Set(open.map((o) => o.employeeId));

    const q: EmployeeListQuery = { userId };
    const employees = await listEmployeesByQuery(q);
    const nameById = new Map(employees.map((e) => [e.id, e.name]));

    const mapped = rows.map((r) => {
      const successRatePct = Math.round(Number(r.successRatePct) * 10) / 10;
      const avgLatencyMs = Math.round(Number(r.avgLatencyMs));
      let status: EmployeePerformanceRecord["status"] = "idle";
      if (activeSet.has(r.employeeId)) status = "active";
      else if (successRatePct > 0 && successRatePct < 90) status = "error";

      return {
        employeeId: r.employeeId,
        name: nameById.get(r.employeeId) ?? r.employeeId,
        sessions: Number(r.sessions ?? 0),
        successRatePct,
        avgLatencyMs,
        status,
      };
    });

    const seen = new Set(mapped.map((m) => m.employeeId));
    for (const e of employees) {
      if (!seen.has(e.id)) {
        mapped.push({
          employeeId: e.id,
          name: e.name,
          sessions: 0,
          successRatePct: 0,
          avgLatencyMs: 0,
          status: "idle",
        });
      }
    }

    mapped.sort((a, b) => a.name.localeCompare(b.name));
    return mapped;
  } catch {
    return [];
  }
}

export async function getUsageStats(userId: string) {
  return getUsageForUser(userId);
}

export async function getRealtimeStats(userId: string): Promise<RealtimeStatsRecord> {
  try {
    const [activeRow] = await db
      .select({ c: count() })
      .from(aiSession)
      .where(
        and(
          eq(aiSession.userId, userId),
          isNull(aiSession.endedAt),
          gte(aiSession.updatedAt, activeSessionSince()),
        ),
      );
    const activeSessions = Number(activeRow?.c ?? 0);

    const since60 = rolling60sStart();
    const [evRow] = await db
      .select({ c: count() })
      .from(usageEvent)
      .where(
        and(eq(usageEvent.userId, userId), gte(usageEvent.createdAt, since60)),
      );
    const eventsInWindow = Number(evRow?.c ?? 0);
    const eventsPerSecond = Math.round((eventsInWindow / 60) * 100) / 100;

    const since1h = rolling1hStart();
    const [health] = await db
      .select({
        ok: sql<number>`coalesce(sum(case when ${aiSession.success} is true then 1 else 0 end)::int, 0)`,
        total: sql<number>`count(*)::int`,
      })
      .from(aiSession)
      .where(
        and(eq(aiSession.userId, userId), gte(aiSession.startedAt, since1h)),
      );

    const total = Number(health?.total ?? 0);
    const ok = Number(health?.ok ?? 0);
    const streamHealthPct =
      total > 0 ? Math.round((ok / total) * 1000) / 10 : null;

    return {
      activeSessions,
      eventsPerSecond,
      streamHealthPct,
    };
  } catch {
    return { activeSessions: 0, eventsPerSecond: 0, streamHealthPct: null };
  }
}

export async function getTimeline(userId: string): Promise<TimelineHourRecord[]> {
  try {
    const since = rolling24hStart();
    const rows = await db
      .select({ startedAt: aiSession.startedAt })
      .from(aiSession)
      .where(and(eq(aiSession.userId, userId), gte(aiSession.startedAt, since)));

    const buckets = new Array(24).fill(0) as number[];
    const windowMs = 60 * 60 * 1000;
    const startMs = since.getTime();

    for (const r of rows) {
      const t = r.startedAt.getTime();
      const idx = Math.floor((t - startMs) / windowMs);
      if (idx >= 0 && idx < 24) buckets[idx] += 1;
    }

    return buckets.map((sessionsCount, hourIndex) => ({
      hourIndex,
      sessionsCount,
    }));
  } catch {
    return Array.from({ length: 24 }, (_, hourIndex) => ({
      hourIndex,
      sessionsCount: 0,
    }));
  }
}
