import { analyticsCardClassName } from "@/components/analytics/analyticsSurface";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";

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
  const fte = businessImpact.equivalentFte;

  return (
    <Card size="sm" className={analyticsCardClassName()}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-neutral-100">Business impact</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          ROI narrative for finance — model estimate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-[11px] text-neutral-500">AI-handled tasks</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">
              {businessImpact.aiHandledTasks.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-600">This period</div>
          </div>
          <div>
            <div className="text-[11px] text-neutral-500">Equiv. FTE</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">
              ~{fte}
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-600">Blended roles</div>
          </div>
          <div>
            <div className="text-[11px] text-neutral-500">Cost saved (est.)</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-400/90">
              {formatCostUsd(businessImpact.costSavedUsd)}
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-600">Vs. baseline</div>
          </div>
        </div>
        <Separator className="bg-neutral-800/80" />
        <p className="text-xs leading-snug text-neutral-400">{businessImpact.narrative}</p>
      </CardContent>
    </Card>
  );
}
