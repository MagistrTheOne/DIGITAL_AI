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

const MAX_WORKFORCE_LEVEL = 6;
const ANALYTICS_ROLLING_DAYS = 30;

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

function computeWorkforceLevel(
  sessionsInWindow: number,
): AnalyticsDashboardDTO["workforceLevel"] {
  const span = getWorkforceSessionsPerTier();
  const rawLevel = Math.floor(sessionsInWindow / span) + 1;
  const level = Math.min(
    MAX_WORKFORCE_LEVEL,
    Math.max(1, rawLevel),
  );
  const atMaxTier = rawLevel >= MAX_WORKFORCE_LEVEL;

  const mod = sessionsInWindow % span;
  const progressPct = atMaxTier
    ? 0
    : Math.min(99, Math.floor((mod / span) * 100));

  let sessionsToNextTier = 0;
  if (!atMaxTier) {
    sessionsToNextTier =
      mod === 0 && sessionsInWindow > 0 ? span : span - mod;
  }

  const nextTierName = atMaxTier
    ? null
    : (TIER_NAMES[level + 1] ?? null);

  const tierName = TIER_NAMES[level] ?? `Level ${level}`;

  const hint = atMaxTier
    ? `You’ve reached the top progression tier for the last ${ANALYTICS_ROLLING_DAYS} days (${sessionsInWindow.toLocaleString()} workspace sessions). Usage plan limits still apply; this band is motivational only.`
    : `Last ${ANALYTICS_ROLLING_DAYS} days: ${sessionsInCurrentTierLabel(mod, span)} toward “${nextTierName ?? "next tier"}” (${span.toLocaleString()} sessions per level).`;

  return {
    level,
    tierName,
    progressPct,
    atMaxTier,
    nextTierName,
    rollingWindowDays: ANALYTICS_ROLLING_DAYS,
    sessionsPerTier: span,
    sessionsInWindow,
    sessionsInCurrentTier: mod,
    sessionsToNextTier,
    hint,
    ...(process.env.NODE_ENV === "development"
      ? {
          devHint: `Tuning: ANALYTICS_WORKFORCE_SESSIONS_PER_TIER=${span}; max level ${MAX_WORKFORCE_LEVEL}; rawLevel=${rawLevel}.`,
        }
      : {}),
  };
}

function sessionsInCurrentTierLabel(mod: number, span: number): string {
  if (mod === 0) return `0 / ${span} sessions in this band`;
  return `${mod.toLocaleString()} / ${span.toLocaleString()} sessions in this band`;
}

function computeBusinessImpact(kpis: {
  sessionsHandled: number;
  costSavedUsd: number;
}): AnalyticsDashboardDTO["businessImpact"] {
  const workspaceSessions30d = kpis.sessionsHandled;
  const divisor = getFteSessionsDivisor();
  const modeledFte = Math.round((workspaceSessions30d / divisor) * 10) / 10;

  const narrative =
    `About ${modeledFte} modeled FTE-equivalent from ${workspaceSessions30d.toLocaleString()} workspace sessions in the last ${ANALYTICS_ROLLING_DAYS} days ` +
    `(illustrative: ${divisor.toLocaleString()} sessions ≈ one FTE unit in this model). Use it for directional capacity stories, not payroll or headcount.`;

  const disclaimer =
    "“Cost saved” aggregates session-level estimates from telemetry. Modeled FTE uses only session volume—two separate lenses.";

  return {
    workspaceSessions30d,
    modeledFte,
    costSavedUsd: kpis.costSavedUsd,
    narrative,
    disclaimer,
    sessionsPerModeledFte: divisor,
    rollingWindowDays: ANALYTICS_ROLLING_DAYS,
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
