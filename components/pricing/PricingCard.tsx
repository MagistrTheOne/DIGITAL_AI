import Link from "next/link";
import { Check } from "lucide-react";

import type { PricingPlan } from "@/components/pricing/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PricingCard({ plan }: { plan: PricingPlan }) {
  const isExternal = plan.href.startsWith("mailto:");

  return (
    <Card
      className={cn(
        "h-full border-neutral-800 bg-neutral-950/50 py-0 shadow-none ring-0",
        plan.highlighted &&
          "border-neutral-500 bg-neutral-900/70 ring-1 ring-neutral-400/35",
      )}
    >
      <CardHeader className="border-b border-neutral-800/80 px-6 pb-4 pt-6">
        <div className="flex min-h-7 flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-neutral-100">{plan.name}</h3>
          {plan.badge ? (
            <Badge
              variant="secondary"
              className="border border-neutral-600 bg-neutral-800/80 text-xs font-medium text-neutral-200"
            >
              {plan.badge}
            </Badge>
          ) : null}
        </div>
        <p className="text-2xl font-semibold tracking-tight text-neutral-100">
          {plan.priceLabel}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-6 pb-6 pt-5">
        <ul className="flex flex-1 flex-col gap-2.5 text-sm text-neutral-400">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2.5">
              <Check
                className="mt-0.5 size-4 shrink-0 text-neutral-500"
                aria-hidden
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="mt-auto border-t border-neutral-800/80 px-6 py-4">
        <Button
          asChild
          variant={plan.ctaVariant}
          className={cn(
            "w-full",
            plan.ctaVariant === "default" &&
              "bg-neutral-200 text-neutral-950 hover:bg-neutral-300",
            plan.ctaVariant === "outline" &&
              "border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900",
          )}
        >
          {isExternal ? (
            <a href={plan.href}>{plan.ctaLabel}</a>
          ) : (
            <Link href={plan.href}>{plan.ctaLabel}</Link>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
