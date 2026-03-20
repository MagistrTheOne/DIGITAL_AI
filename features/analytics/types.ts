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
  };
  workforceLevel: {
    level: number;
    tierName: string;
    progressPct: number;
    hint: string;
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
    streamHealthPct: number;
  };
  timeline: Array<{
    hourIndex: number;
    sessionsCount: number;
  }>;
  businessImpact: {
    aiHandledTasks: number;
    equivalentFte: number;
    costSavedUsd: number;
    narrative: string;
  };
};
