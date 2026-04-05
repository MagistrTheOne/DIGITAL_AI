import Link from "next/link";
import { Check } from "lucide-react";

import type { PricingPlan } from "@/components/pricing/types";
import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STAGGER_DELAY = [
  "delay-[0ms]",
  "delay-[75ms]",
  "delay-[150ms]",
  "delay-[225ms]",
] as const;

const HERO_FEATURE_COUNT = 2;

export function PricingCard({
  plan,
  index,
  priceLabel,
  priceHint,
  href: hrefProp,
  ctaLabelOverride,
}: {
  plan: PricingPlan;
  index: number;
  priceLabel: string;
  priceHint?: string;
  /** Overrides `plan.href` (e.g. Polar checkout with billing period). */
  href?: string;
  ctaLabelOverride?: string;
}) {
  const href = hrefProp ?? plan.href;
  const cta = ctaLabelOverride ?? plan.ctaLabel;
  const isExternal = href.startsWith("mailto:");
  const isApiCheckout = href.startsWith("/api/");
  const stagger =
    STAGGER_DELAY[Math.min(index, STAGGER_DELAY.length - 1)] ?? "delay-[0ms]";

  const linkRel = "noopener noreferrer";

  return (
    <Card
      size="sm"
      className={cn(
        dashboardGlassCardClassName(),
        "gap-0! py-0!",
        "h-full transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-neutral-600/80",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
        "motion-reduce:animate-none motion-reduce:opacity-100",
        stagger,
        "motion-reduce:delay-0!",
        plan.highlighted &&
          "border-violet-500/35 ring-1 ring-violet-500/25 hover:border-violet-400/45 hover:ring-violet-400/35",
        plan.highlighted &&
          "lg:z-10 lg:scale-[1.02] motion-reduce:lg:scale-100",
      )}
    >
      <CardHeader className="border-b border-neutral-800/80 px-5 pb-3 pt-5">
        <div className="flex min-h-7 flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <h3 className="text-base font-semibold text-neutral-100">{plan.name}</h3>
            {plan.tagline ? (
              <p className="text-[11px] leading-snug text-neutral-500">{plan.tagline}</p>
            ) : null}
          </div>
          {plan.badge ? (
            <Badge
              variant="secondary"
              className="shrink-0 border border-neutral-600 bg-neutral-800/80 text-xs font-medium text-neutral-200"
            >
              {plan.badge}
            </Badge>
          ) : null}
        </div>
        <div className="mt-3 space-y-0.5 border-t border-neutral-800/40 pt-3">
          <p className="text-2xl font-semibold tracking-tight text-neutral-100 transition-colors duration-200">
            {priceLabel}
          </p>
          {priceHint ? (
            <p className="text-[11px] text-neutral-500 transition-colors duration-200">{priceHint}</p>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-600">
          What&apos;s included
        </p>
        <ul className="flex flex-1 flex-col gap-2 text-sm">
          {plan.features.map((f, i) => {
            const hero = i < HERO_FEATURE_COUNT;
            return (
              <li
                key={`${plan.id}-${i}`}
                className={cn(
                  "flex gap-2 transition-colors duration-150",
                  hero
                    ? "font-medium text-neutral-300 hover:text-neutral-200"
                    : "text-neutral-400 hover:text-neutral-300",
                )}
              >
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    hero ? "text-violet-400/80" : "text-neutral-500",
                  )}
                  aria-hidden
                />
                <span>{f}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-2 border-t border-neutral-800/80 px-5 py-3">
        <Button
          asChild
          variant={plan.ctaVariant}
          className={cn(
            "w-full transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]",
            "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
            plan.ctaVariant === "default" &&
              "bg-neutral-200 text-neutral-950 hover:bg-neutral-300",
            plan.ctaVariant === "outline" &&
              "border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900",
          )}
        >
          {isExternal ? (
            <a href={href} rel={linkRel}>
              {cta}
            </a>
          ) : isApiCheckout ? (
            <a href={href} rel={linkRel}>
              {cta}
            </a>
          ) : (
            <Link href={href}>{cta}</Link>
          )}
        </Button>
        {plan.ctaSubtext ? (
          <p className="text-center text-xs text-neutral-500">{plan.ctaSubtext}</p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
