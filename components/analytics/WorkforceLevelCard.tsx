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
  const { atMaxTier, sessionsToNextTier, nextTierName, sessionsPerTier } =
    workforce;

  return (
    <Card
      size="sm"
      className={cn(analyticsCardClassName(), "border-neutral-700/50")}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-1.5">
        <div className="space-y-0.5">
          <CardTitle className="text-sm text-neutral-100">
            AI workforce level
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Motivational tier from workspace session volume — separate from plan
            usage caps.
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
          <span className="text-base font-semibold text-neutral-100">
            {workforce.tierName}
          </span>
          <span className="text-[11px] text-neutral-500">tier</span>
        </div>

        {atMaxTier ? (
          <div className="rounded-md border border-violet-500/25 bg-violet-500/5 px-2.5 py-2">
            <p className="text-[11px] font-medium text-violet-200/90">
              Top progression tier
            </p>
            <p className="mt-0.5 text-[11px] tabular-nums text-neutral-400">
              {workforce.sessionsInWindow.toLocaleString()} sessions in the last{" "}
              {workforce.rollingWindowDays} days
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-neutral-500">
              <span>
                Toward{" "}
                <span className="text-neutral-300">{nextTierName}</span>
              </span>
              <span className="tabular-nums text-neutral-400">
                {workforce.progressPct}%
              </span>
            </div>
            <Progress
              value={workforce.progressPct}
              className="h-1.5 bg-neutral-800 **:data-[slot=progress-indicator]:bg-violet-500"
            />
            <p className="text-[11px] tabular-nums text-neutral-500">
              {sessionsToNextTier.toLocaleString()} session
              {sessionsToNextTier === 1 ? "" : "s"} to go · band size{" "}
              {sessionsPerTier.toLocaleString()}
            </p>
          </div>
        )}

        <p className="text-xs leading-snug text-neutral-400">{workforce.hint}</p>

        {workforce.devHint ? (
          <p className="rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 font-mono text-[10px] leading-snug text-amber-200/80">
            {workforce.devHint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
