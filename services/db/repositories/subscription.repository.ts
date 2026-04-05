/**
 * Polar (and future providers) subscription rows → plan resolution via user-plan.repository.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Subscription as PolarSubscription } from "@polar-sh/sdk/models/components/subscription";

import { db } from "@/db";
import { subscription } from "@/db/schema";
import type { PlanType } from "@/features/account/types";
import {
  DEFAULT_PLAN_TYPE,
  highestPlanType,
  planTypeFromString,
} from "@/features/account/plan-config";
import { planTypeForPolarProductId } from "@/lib/billing/polar-env";
import {
  setUserPlanType,
  SUBSCRIPTION_STATUS,
} from "@/services/db/repositories/user-plan.repository";

const GRANTING_STATUSES = [
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
] as const;

function mapPolarStatusToLocal(
  polarStatus: string,
): (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS] {
  switch (polarStatus) {
    case "active":
      return SUBSCRIPTION_STATUS.ACTIVE;
    case "trialing":
      return SUBSCRIPTION_STATUS.TRIALING;
    case "past_due":
      return SUBSCRIPTION_STATUS.PAST_DUE;
    case "canceled":
      return SUBSCRIPTION_STATUS.CANCELED;
    case "incomplete":
      return SUBSCRIPTION_STATUS.INCOMPLETE;
    case "unpaid":
    case "incomplete_expired":
      return SUBSCRIPTION_STATUS.PAST_DUE;
    default:
      return SUBSCRIPTION_STATUS.CANCELED;
  }
}

export async function refreshUserPlanFromSubscriptions(
  userId: string,
): Promise<void> {
  const rows = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        inArray(subscription.status, [...GRANTING_STATUSES]),
      ),
    )
    .orderBy(desc(subscription.updatedAt));

  let best: PlanType | null = null;
  for (const row of rows) {
    const pt = planTypeFromString(row.planType);
    if (!pt) continue;
    best = best ? highestPlanType(best, pt) : pt;
  }

  if (best) {
    await setUserPlanType(userId, best);
    return;
  }

  await setUserPlanType(userId, DEFAULT_PLAN_TYPE);
}

/**
 * Upserts a row from Polar webhook payloads (`subscription.*` events).
 */
export async function upsertPolarSubscription(
  data: PolarSubscription,
): Promise<void> {
  const userId = data.customer.externalId?.trim();
  if (!userId) {
    console.warn(
      "[polar] subscription webhook: missing customer.external_id; set externalCustomerId at checkout",
    );
    return;
  }

  const planType: PlanType | null = planTypeForPolarProductId(data.productId);
  if (!planType) {
    console.warn(
      `[polar] unmapped product_id ${data.productId}; set POLAR_PRODUCT_PRO (or _MONTHLY/_YEARLY) and/or POLAR_PRODUCT_ENTERPRISE`,
    );
    return;
  }

  const status = mapPolarStatusToLocal(String(data.status));
  const now = new Date();
  const polarId = data.id;

  await db
    .insert(subscription)
    .values({
      id: polarId,
      userId,
      planType,
      status,
      provider: "polar",
      externalId: polarId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: subscription.id,
      set: {
        userId,
        planType,
        status,
        provider: "polar",
        externalId: polarId,
        updatedAt: now,
      },
    });

  await refreshUserPlanFromSubscriptions(userId);
}
