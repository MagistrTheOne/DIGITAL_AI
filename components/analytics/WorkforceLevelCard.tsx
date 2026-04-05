"use client";

import { analyticsCardClassName } from "@/components/analytics/analyticsSurface";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

export function WorkforceLevelCard({
  workforce,
}: {
  workforce: AnalyticsDashboardDTO["workforceLevel"];
}) {
  return (
    <Card
      size="sm"
      className={cn(analyticsCardClassName(), "border-neutral-700/50")}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-1.5">
        <div className="space-y-0.5">
          <CardTitle className="text-sm text-neutral-100">AI workforce level</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Gamified tier from transcript-session volume — secondary to usage caps.
          </CardDescription>
        </div>
        <Badge
          variant="secondary"
          className="border border-neutral-700 bg-neutral-900 text-neutral-200"
        >
          Level {workforce.level}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-base font-semibold text-neutral-100">{workforce.tierName}</span>
          <span className="text-[11px] text-neutral-500">tier</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>Next level</span>
            <span className="tabular-nums text-neutral-400">{workforce.progressPct}%</span>
          </div>
          <Progress
            value={workforce.progressPct}
            className="h-1.5 bg-neutral-800 **:data-[slot=progress-indicator]:bg-violet-500"
          />
        </div>
        <p className="text-xs leading-snug text-neutral-400">{workforce.hint}</p>
      </CardContent>
    </Card>
  );
}
