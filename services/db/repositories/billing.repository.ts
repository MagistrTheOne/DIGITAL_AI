/**
 * Billing / subscription — resolves plan for a user.
 * Future: join subscription / Polar customer rows; `plan-config` is the source of truth for limits.
 */
import type { PlanConfig, PlanType } from "@/features/account/types";
import {
  DEFAULT_PLAN_TYPE,
  getPlanConfig,
} from "@/features/account/plan-config";

/**
 * Stub: every user maps to FREE until DB / Polar wiring exists.
 * Replace with persisted subscription lookup.
 */
async function resolvePlanTypeForUser(_userId: string): Promise<PlanType> {
  return DEFAULT_PLAN_TYPE;
}

export async function getPlanForUser(userId: string): Promise<PlanConfig> {
  const planType = await resolvePlanTypeForUser(userId);
  return getPlanConfig(planType);
}
