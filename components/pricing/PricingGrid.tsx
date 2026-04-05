"use client";

import * as React from "react";

import { PRICING_PLANS } from "@/components/pricing/plans";
import {
  planDisplayPrice,
  type BillingPeriod,
} from "@/components/pricing/planDisplay";
import { PricingCard } from "@/components/pricing/PricingCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function PricingGrid({
  polarProCheckout = false,
  polarEnterpriseCheckout = false,
}: {
  polarProCheckout?: boolean;
  polarEnterpriseCheckout?: boolean;
}) {
  const [billing, setBilling] = React.useState<BillingPeriod>("monthly");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          "rounded-xl border border-neutral-800/70 bg-neutral-950/25 px-4 py-3 backdrop-blur-md sm:rounded-2xl sm:px-5",
        )}
      >
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-neutral-200">Billing period</p>
          <p className="text-xs text-neutral-500">
            Yearly saves on Pro, Free and custom plans unchanged.
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={billing}
          onValueChange={(v) => {
            if (v === "monthly" || v === "yearly") setBilling(v);
          }}
          variant="outline"
          spacing={0}
          className="w-full shrink-0 rounded-lg border border-neutral-700 bg-neutral-900/60 p-0.5 sm:w-auto"
          aria-label="Billing period"
        >
          <ToggleGroupItem
            value="monthly"
            className="min-h-9 flex-1 px-4 text-xs font-medium text-neutral-300 data-[state=on]:bg-neutral-200 data-[state=on]:text-neutral-950 data-[state=off]:hover:bg-neutral-800/80 sm:flex-none"
          >
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem
            value="yearly"
            className="min-h-9 flex-1 px-4 text-xs font-medium text-neutral-300 data-[state=on]:bg-neutral-200 data-[state=on]:text-neutral-950 data-[state=off]:hover:bg-neutral-800/80 sm:flex-none"
          >
            Yearly
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div
        className={cn(
          "grid w-full grid-cols-1 items-stretch gap-4 overflow-visible",
          "sm:grid-cols-2 sm:gap-5",
          "lg:grid-cols-2 lg:gap-5",
          "xl:grid-cols-4 xl:gap-5",
        )}
      >
        {PRICING_PLANS.map((plan, index) => {
          const { priceLabel, priceHint } = planDisplayPrice(plan, billing);
          let resolvedHref = plan.href;
          let ctaLabelOverride: string | undefined;
          if (polarProCheckout && plan.id === "pro") {
            resolvedHref = `/api/billing/polar/checkout?period=${billing}`;
          } else if (polarEnterpriseCheckout && plan.id === "enterprise") {
            resolvedHref = "/api/billing/polar/checkout?plan=enterprise";
            ctaLabelOverride = "Subscribe with Polar";
          }
          return (
            <div key={plan.id} className="min-w-0 overflow-visible">
              <PricingCard
                plan={plan}
                index={index}
                priceLabel={priceLabel}
                priceHint={priceHint}
                href={resolvedHref}
                ctaLabelOverride={ctaLabelOverride}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
