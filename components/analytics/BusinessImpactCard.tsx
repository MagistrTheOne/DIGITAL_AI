import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

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
    <Card size="sm" className={cn(cardSurface)}>
      <CardHeader>
        <CardTitle className="text-base text-neutral-100">AI vs human impact</CardTitle>
        <CardDescription className="text-neutral-500">
          Rough equivalence vs staffing (model estimate).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-neutral-500">AI-handled tasks</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
              {businessImpact.aiHandledTasks.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-600">This period</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Equivalent humans (FTE)</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
              ~{fte}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-600">Blended roles</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Cost saved (est.)</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-400/90">
              {formatCostUsd(businessImpact.costSavedUsd)}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-600">Vs. baseline</div>
          </div>
        </div>
        <Separator className="bg-neutral-800" />
        <p className="text-sm leading-relaxed text-neutral-400">{businessImpact.narrative}</p>
      </CardContent>
    </Card>
  );
}
