/**
 * DB-backed plan assignment (subscription row + user.plan_type fallback).
 * Limits/features remain in `features/account/plan-config.ts`.
 */
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/services/db/client";
import { subscription, user } from "@/db/schema";
import type { PlanType } from "@/features/account/types";
import {
  DEFAULT_PLAN_TYPE,
  highestPlanType,
  planTypeFromString,
} from "@/features/account/plan-config";

/** Lifecycle — extend when integrating Polar / Stripe webhooks. */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  CANCELED: "canceled",
  PAST_DUE: "past_due",
  TRIALING: "trialing",
  INCOMPLETE: "incomplete",
} as const;

const SUBSCRIPTION_GRANTS_PLAN = [
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
] as const;

async function resolveUserPlanType(userId: string): Promise<PlanType> {
  const activeSubs = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        inArray(subscription.status, [...SUBSCRIPTION_GRANTS_PLAN]),
      ),
    )
    .orderBy(desc(subscription.updatedAt));

  let best: PlanType | null = null;
  for (const subRow of activeSubs) {
    const fromSub = planTypeFromString(subRow.planType);
    if (!fromSub) continue;
    best = best ? highestPlanType(best, fromSub) : fromSub;
  }
  if (best) return best;

  const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!u) return DEFAULT_PLAN_TYPE;

  const fromUser = planTypeFromString(u.planType);
  return fromUser ?? DEFAULT_PLAN_TYPE;
}

export async function getUserPlanType(userId: string): Promise<PlanType> {
  return resolveUserPlanType(userId);
}

/** Alias for BFF / billing layers that name resolution explicitly. */
export async function resolvePlanTypeForUser(userId: string): Promise<PlanType> {
  return resolveUserPlanType(userId);
}

export async function setUserPlanType(
  userId: string,
  planType: PlanType,
): Promise<void> {
  await db
    .update(user)
    .set({
      planType,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}
