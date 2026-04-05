"use client";

import * as React from "react";
import Link from "next/link";

import { PRICING_PLANS } from "@/components/pricing/plans";
import {
  planDisplayPrice,
  type BillingPeriod,
} from "@/components/pricing/planDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

function ctaHref(planId: string, fallback: string): string {
  if (planId === "free" || planId === "pro") return "/sign-up";
  return fallback;
}

export function LandingPricingVerticalCards() {
  const [billing, setBilling] = React.useState<BillingPeriod>("monthly");
  const [selected, setSelected] = React.useState<string>("pro");

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-5",
        )}
      >
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-neutral-200">Billing period</p>
          <p className="text-xs text-neutral-500">
            Yearly saves on Pro; Free and custom lanes stay as listed.
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
          className="w-full shrink-0 rounded-lg border border-white/15 bg-black/50 p-0.5 sm:w-auto"
          aria-label="Billing period"
        >
          <ToggleGroupItem
            value="monthly"
            className="min-h-9 flex-1 px-4 text-xs font-medium text-neutral-300 data-[state=on]:bg-white data-[state=on]:text-neutral-950 data-[state=off]:hover:bg-white/10 sm:flex-none"
          >
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem
            value="yearly"
            className="min-h-9 flex-1 px-4 text-xs font-medium text-neutral-300 data-[state=on]:bg-white data-[state=on]:text-neutral-950 data-[state=off]:hover:bg-white/10 sm:flex-none"
          >
            Yearly
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {PRICING_PLANS.map((plan) => {
          const { priceLabel, priceHint } = planDisplayPrice(plan, billing);
          const href = ctaHref(plan.id, plan.href);
          const isSelected = selected === plan.id;
          const isExternal = href.startsWith("mailto:");
          const isEnterprise = plan.id === "enterprise";

          return (
            <Card
              key={plan.id}
              size="sm"
              className={cn(
                "flex h-full min-h-[480px] flex-col gap-0 border-white/10 bg-neutral-950/80 py-0 text-neutral-100 shadow-none ring-1 ring-transparent transition-[border-color,box-shadow,transform] duration-200",
                "hover:border-white/16",
                plan.highlighted && "border-violet-500/25 ring-violet-500/15",
                isSelected &&
                  "border-white/22 ring-white/20 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.9)] sm:scale-[1.02]",
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelected(plan.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(plan.id);
                  }
                }}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/35",
                )}
              >
                <CardHeader className="flex flex-1 flex-col border-b border-white/10 px-5 pb-4 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-lg font-semibold text-white">
                      {plan.name}
                    </CardTitle>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {plan.badge ? (
                        <Badge
                          variant="secondary"
                          className="border border-white/15 bg-white/5 text-[10px] font-medium uppercase tracking-wider text-neutral-200"
                        >
                          {plan.badge}
                        </Badge>
                      ) : null}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border text-[10px] font-medium uppercase tracking-wider",
                          isSelected
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-white/10 bg-black/50 text-neutral-500",
                        )}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Badge>
                    </div>
                  </div>
                  {plan.tagline ? (
                    <p
                      className={cn(
                        "mt-3 text-sm leading-relaxed text-neutral-400",
                        isEnterprise && "text-sm sm:text-[15px]",
                      )}
                    >
                      {plan.tagline}
                    </p>
                  ) : null}
                  <div className="mt-6 space-y-1 border-t border-white/10 pt-4">
                    <p className="text-2xl font-semibold tracking-tight text-white">
                      {priceLabel}
                    </p>
                    {priceHint ? (
                      <p className="text-xs text-neutral-500">{priceHint}</p>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent
                  className={cn(
                    "flex flex-1 flex-col px-5 pb-4 pt-4",
                    !isSelected && "max-h-52 overflow-hidden sm:max-h-56",
                  )}
                >
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600">
                    Included
                  </p>
                  <ul className="space-y-2.5 text-sm leading-relaxed text-neutral-400">
                    {plan.features.map((f) => (
                      <li key={f} className="text-pretty">
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

                <CardFooter className="mt-auto flex flex-col gap-2 border-t border-white/10 px-5 py-4">
                  <Button
                    asChild
                    variant={plan.ctaVariant}
                    className={cn(
                      "w-full",
                      plan.ctaVariant === "default" &&
                        "bg-white text-neutral-950 hover:bg-neutral-200",
                      plan.ctaVariant === "outline" &&
                        "border-white/20 bg-transparent text-neutral-100 hover:bg-white/10",
                    )}
                  >
                    {isExternal ? (
                      <a href={href} rel="noopener noreferrer">
                        {plan.ctaLabel}
                      </a>
                    ) : (
                      <Link href={href}>{plan.ctaLabel}</Link>
                    )}
                  </Button>
                  {plan.ctaSubtext ? (
                    <p className="text-center text-[11px] text-neutral-500">
                      {plan.ctaSubtext}
                    </p>
                  ) : null}
                </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
