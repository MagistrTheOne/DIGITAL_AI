"use client";

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

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

export function WorkforceLevelCard({
  workforce,
}: {
  workforce: AnalyticsDashboardDTO["workforceLevel"];
}) {
  return (
    <Card size="sm" className={cn(cardSurface, "border-neutral-700/80")}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base text-neutral-100">AI workforce level</CardTitle>
          <CardDescription className="text-neutral-500">
            XP-like progression for your deployed agents.
          </CardDescription>
        </div>
        <Badge
          variant="secondary"
          className="border border-neutral-700 bg-neutral-900 text-neutral-200"
        >
          Level {workforce.level}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-semibold text-neutral-100">{workforce.tierName}</span>
          <span className="text-xs text-neutral-500">— tier name</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Progress to next level</span>
            <span className="tabular-nums text-neutral-400">{workforce.progressPct}%</span>
          </div>
          <Progress
            value={workforce.progressPct}
            className="h-2 bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-violet-500"
          />
        </div>
        <p className="text-sm leading-relaxed text-neutral-400">{workforce.hint}</p>
      </CardContent>
    </Card>
  );
}
