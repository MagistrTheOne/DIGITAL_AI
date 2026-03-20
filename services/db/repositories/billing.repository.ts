/**
 * Billing — resolves effective plan from DB assignment + plan-config behavior.
 */
import type { PlanConfig } from "@/features/account/types";
import { getPlanConfig } from "@/features/account/plan-config";
import { getUserPlanType } from "@/services/db/repositories/user-plan.repository";

export async function getPlanForUser(userId: string): Promise<PlanConfig> {
  const planType = await getUserPlanType(userId);
  return getPlanConfig(planType);
}
