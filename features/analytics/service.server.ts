import { getCurrentSession } from "@/lib/auth/session.server";
import {
  getEmployeePerformance,
  getKpiMetrics,
  getRealtimeStats,
  getTimeline,
  getUsageStats,
} from "@/services/db/repositories/analytics.repository";

import type { AnalyticsDashboardDTO } from "@/features/analytics/types";

const TIER_NAMES = [
  "",
  "Onboard",
  "Operate",
  "Scaling",
  "Architect",
  "Command",
  "Fleet",
] as const;

function computeWorkforceLevel(sessionsHandled: number) {
  const level = Math.min(6, Math.max(1, Math.floor(sessionsHandled / 500) + 1));
  const span = 500;
  const progressPct = Math.min(
    100,
    Math.round(((sessionsHandled % span) / span) * 100),
  );
  const tierName = TIER_NAMES[level] ?? "Level";
  return {
    level,
    tierName,
    progressPct,
    hint:
      "Optimize latency and increase sessions to reach the next tier — telemetry-driven progression.",
  };
}

function computeBusinessImpact(kpis: {
  sessionsHandled: number;
  costSavedUsd: number;
}): AnalyticsDashboardDTO["businessImpact"] {
  const aiHandledTasks = kpis.sessionsHandled;
  const equivalentFte = Math.round((aiHandledTasks / 4000) * 10) / 10;
  const narrative = `AI replaced roughly ${equivalentFte} full-time equivalents this period — reinvest capacity into higher-leverage work (model estimate).`;

  return {
    aiHandledTasks,
    equivalentFte,
    costSavedUsd: kpis.costSavedUsd,
    narrative,
  };
}

/**
 * Single entry for analytics BFF — parallel repository reads, no UI coupling.
 */
export async function getAnalyticsDashboardDTO(): Promise<AnalyticsDashboardDTO | null> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [kpisRaw, employees, usage, realtime, timeline] = await Promise.all([
    getKpiMetrics(userId),
    getEmployeePerformance(userId),
    getUsageStats(userId),
    getRealtimeStats(userId),
    getTimeline(userId),
  ]);

  const kpis = {
    costSavedUsd: Math.round(kpisRaw.costSavedUsd * 100) / 100,
    sessionsHandled: kpisRaw.sessionsHandled,
    avgLatencyMs: kpisRaw.avgLatencyMs,
    successRatePct: kpisRaw.successRatePct,
    efficiencyGainPct: kpisRaw.efficiencyGainPct,
    costSavedTrendPct: kpisRaw.costSavedTrendPct,
    sessionsTrendPct: kpisRaw.sessionsTrendPct,
    latencyTrendMs: kpisRaw.latencyTrendMs,
    efficiencyTrendPts: kpisRaw.efficiencyTrendPts,
  };

  const workforceLevel = computeWorkforceLevel(kpis.sessionsHandled);
  const businessImpact = computeBusinessImpact(kpis);

  return {
    kpis,
    workforceLevel,
    employees,
    usage,
    realtime,
    timeline,
    businessImpact,
  };
}
