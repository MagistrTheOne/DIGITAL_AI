/**
 * Account strip DTO for dashboard UI (BFF → client).
 * No DB or Better Auth internal types.
 */
export type AccountDashboardDTO = {
  name: string;
  email: string;
  image?: string | null;
  plan: string;
  usage: {
    sessions: string;
    tokens: string;
  };
};

/** Central plan identifiers — backend-only; UI receives human `plan` string from DTO. */
export type PlanType = "FREE" | "PRO" | "ENTERPRISE" | "GOVTECH";

/** Use `-1` for unlimited sessions or tokens in `limits`. */
export interface PlanConfig {
  name: PlanType;
  label: string;
  limits: {
    sessions: number;
    tokens: number;
  };
  features: string[];
}
