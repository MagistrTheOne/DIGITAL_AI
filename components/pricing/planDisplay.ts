import type { PricingPlan } from "@/components/pricing/types";

export type BillingPeriod = "monthly" | "yearly";

export function planDisplayPrice(
  plan: PricingPlan,
  billing: BillingPeriod,
): { priceLabel: string; priceHint?: string } {
  if (billing === "yearly" && plan.yearlyPriceLabel) {
    return {
      priceLabel: plan.yearlyPriceLabel,
      priceHint: plan.yearlyPriceHint ?? plan.priceHint,
    };
  }
  return {
    priceLabel: plan.priceLabel,
    priceHint: plan.priceHint,
  };
}
