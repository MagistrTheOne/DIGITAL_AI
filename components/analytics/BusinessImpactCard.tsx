"use client";

import * as React from "react";

import { analyticsCardClassName } from "@/components/analytics/analyticsSurface";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

function formatCostUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function BusinessImpactCard({
  businessImpact,
}: {
  businessImpact: AnalyticsDashboardDTO["businessImpact"];
}) {
  const [open, setOpen] = React.useState(false);
  const fte = businessImpact.modeledFte;
  const d = businessImpact.rollingWindowDays;

  return (
    <Card size="sm" className={analyticsCardClassName()}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-neutral-100">Business impact</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Illustrative capacity + estimated savings — not financial or HR advice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-[11px] text-neutral-500">Workspace sessions</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">
              {businessImpact.workspaceSessions30d.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-600">
              Distinct sessions · last {d}d
            </div>
          </div>
          <div>
            <div className="text-[11px] text-neutral-500">Modeled FTE</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">
              ~{fte}
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-600">
              Heuristic ({businessImpact.sessionsPerModeledFte.toLocaleString()}{" "}
              sessions / unit)
            </div>
          </div>
          <div>
            <div className="text-[11px] text-neutral-500">Cost saved (est.)</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-400/90">
              {formatCostUsd(businessImpact.costSavedUsd)}
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-600">
              From telemetry baseline
            </div>
          </div>
        </div>
        <Separator className="bg-neutral-800/80" />
        <p className="text-xs leading-snug text-neutral-400">
          {businessImpact.narrative}
        </p>
        <p className="text-[11px] leading-snug text-neutral-500">
          {businessImpact.disclaimer}
        </p>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md py-1.5 text-left text-[11px] font-medium text-neutral-400 transition-colors hover:text-neutral-200",
            )}
          >
            How these numbers relate
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform",
                open && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-1 text-[11px] leading-snug text-neutral-500">
            <p>
              <span className="text-neutral-400">Level progression</span> uses a
              smaller session step (gamification).{" "}
              <span className="text-neutral-400">Modeled FTE</span> uses a larger
              divisor so the headline capacity story is conservative vs. tier
              pacing.
            </p>
            <p>
              Operators can tune both on the server without changing this UI copy.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
