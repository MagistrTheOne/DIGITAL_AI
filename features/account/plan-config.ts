import type { PlanConfig, PlanType } from "@/features/account/types";

/**
 * Single source of truth for plan limits, labels, and feature flags.
 * Billing providers (e.g. Polar) should map product IDs → PlanType, then read config here.
 */
export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: "FREE",
    label: "Free",
    limits: {
      sessions: 10,
      tokens: 500_000,
      employees: 2,
    },
    features: [
      "basic_agents",
      "community_support",
    ],
  },
  PRO: {
    name: "PRO",
    label: "Pro",
    limits: {
      sessions: 100,
      tokens: 5_000_000,
      employees: 15,
    },
    features: [
      "basic_agents",
      "priority_support",
      "api_access",
      "usage_analytics",
    ],
  },
  ENTERPRISE: {
    name: "ENTERPRISE",
    label: "Enterprise",
    limits: {
      sessions: -1,
      tokens: -1,
      employees: -1,
    },
    features: [
      "basic_agents",
      "dedicated_support",
      "api_access",
      "usage_analytics",
      "sso",
      "audit_logs",
      "custom_retention",
    ],
  },
  GOVTECH: {
    name: "GOVTECH",
    label: "GovTech",
    limits: {
      sessions: -1,
      tokens: -1,
      employees: -1,
    },
    features: [
      "basic_agents",
      "gov_compliance",
      "dedicated_support",
      "api_access",
      "usage_analytics",
      "sso",
      "audit_logs",
      "data_residency",
    ],
  },
};

export const DEFAULT_PLAN_TYPE: PlanType = "FREE";

export function getPlanConfig(planType: PlanType): PlanConfig {
  return PLANS[planType];
}

/** Resolve plan from a stable key (future: subscription row, Polar price id). */
export function planTypeFromString(raw: string | null | undefined): PlanType | null {
  if (!raw) return null;
  const u = raw.trim().toUpperCase().replace(/\s+/g, "_");
  if (u === "FREE" || u === "PRO" || u === "ENTERPRISE" || u === "GOVTECH") {
    return u as PlanType;
  }
  return null;
}

/** For server-side gates (Polar product id → PlanType → features). */
export function planHasFeature(planType: PlanType, featureId: string): boolean {
  return PLANS[planType].features.includes(featureId);
}
