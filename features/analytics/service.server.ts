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

function getWorkforceSessionsPerTier(): number {
  const raw = process.env.ANALYTICS_WORKFORCE_SESSIONS_PER_TIER?.trim();
  const n = Number.parseInt(raw ?? "500", 10);
  return Number.isFinite(n) && n > 0 ? n : 500;
}

function getFteSessionsDivisor(): number {
  const raw = process.env.ANALYTICS_FTE_SESSIONS_DIVISOR?.trim();
  const n = Number.parseFloat(raw ?? "4000");
  return Number.isFinite(n) && n > 0 ? n : 4000;
}

function computeWorkforceLevel(sessionsHandled: number) {
  const span = getWorkforceSessionsPerTier();
  const level = Math.min(6, Math.max(1, Math.floor(sessionsHandled / span) + 1));
  const progressPct = Math.min(
    100,
    Math.round(((sessionsHandled % span) / span) * 100),
  );
  const tierName = TIER_NAMES[level] ?? "Level";
  return {
    level,
    tierName,
    progressPct,
    hint: `Levels use distinct transcript sessions in the last 30d (~${span} sessions per level). Set ANALYTICS_WORKFORCE_SESSIONS_PER_TIER to match your rollout.`,
  };
}

function computeBusinessImpact(kpis: {
  sessionsHandled: number;
  costSavedUsd: number;
}): AnalyticsDashboardDTO["businessImpact"] {
  const aiHandledTasks = kpis.sessionsHandled;
  const divisor = getFteSessionsDivisor();
  const equivalentFte = Math.round((aiHandledTasks / divisor) * 10) / 10;
  const narrative = `AI replaced roughly ${equivalentFte} full-time equivalents this period (model: one FTE ≈ ${divisor} transcript sessions recorded in 30d — tune ANALYTICS_FTE_SESSIONS_DIVISOR). Reinvest capacity into higher-leverage work.`;

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
