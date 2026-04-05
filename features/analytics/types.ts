/** Plan caps for usage UI (from billing / plan-config, not part of analytics DTO). */
export type UsagePlanLimits = {
  sessionsLimit: number;
  tokensLimit: number;
};

/**
 * Aggregated analytics for the dashboard BFF (UI maps these fields when wired).
 */
export type AnalyticsDashboardDTO = {
  kpis: {
    costSavedUsd: number;
    sessionsHandled: number;
    avgLatencyMs: number;
    successRatePct: number;
    efficiencyGainPct: number;
    costSavedTrendPct: number | null;
    sessionsTrendPct: number | null;
    latencyTrendMs: number | null;
    efficiencyTrendPts: number | null;
  };
  workforceLevel: {
    level: number;
    tierName: string;
    /**
     * Progress within the current tier toward the next level (0–99).
     * When `atMaxTier` is true, ignore this for “next level” UX.
     */
    progressPct: number;
    atMaxTier: boolean;
    nextTierName: string | null;
    rollingWindowDays: number;
    sessionsPerTier: number;
    /** Distinct `ai_sessions` started in the rolling window (same basis as KPI). */
    sessionsInWindow: number;
    /** Position inside the current tier band (`sessionsInWindow % sessionsPerTier`). */
    sessionsInCurrentTier: number;
    /** Sessions remaining until the next tier; 0 when `atMaxTier`. */
    sessionsToNextTier: number;
    hint: string;
    /** Populated in development only — tuning / env mapping. */
    devHint?: string;
  };
  employees: Array<{
    employeeId: string;
    name: string;
    sessions: number;
    successRatePct: number;
    avgLatencyMs: number;
    status: "active" | "idle" | "error";
  }>;
  usage: {
    sessionsUsed: number;
    tokensUsed: number;
  };
  realtime: {
    activeSessions: number;
    eventsPerSecond: number;
    streamHealthPct: number | null;
  };
  timeline: Array<{
    hourIndex: number;
    sessionsCount: number;
  }>;
  businessImpact: {
    /** Distinct workspace (transcript) sessions in the rolling window. */
    workspaceSessions30d: number;
    /** Illustrative FTE from session volume ÷ divisor (not headcount). */
    modeledFte: number;
    costSavedUsd: number;
    narrative: string;
    disclaimer: string;
    /** Divisor used for modeled FTE (env-tunable). */
    sessionsPerModeledFte: number;
    rollingWindowDays: number;
  };
};
