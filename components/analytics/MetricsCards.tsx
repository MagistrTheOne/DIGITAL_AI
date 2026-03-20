import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

function formatCostUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function buildMetrics(kpis: AnalyticsDashboardDTO["kpis"]) {
  const baselineMs = 1200;
  const deltaMs = kpis.avgLatencyMs - baselineMs;
  const latencyTrendDir = deltaMs <= 0 ? ("down" as const) : ("up" as const);
  const latencyTrendText =
    deltaMs === 0
      ? "0ms"
      : `${deltaMs < 0 ? "−" : "+"}${Math.abs(deltaMs)}ms`;

  return [
    {
      title: "Cost saved",
      value: formatCostUsd(kpis.costSavedUsd),
      description: "Vs. equivalent human labor (est.)",
      trend: { dir: "up" as const, text: `+${kpis.efficiencyGainPct.toFixed(1)}%` },
      period: "Last 30d",
    },
    {
      title: "Sessions handled",
      value: kpis.sessionsHandled.toLocaleString(),
      description: "Rolling window",
      trend: { dir: "up" as const, text: `SR ${kpis.successRatePct.toFixed(1)}%` },
      period: "Last 30d",
    },
    {
      title: "Avg response time",
      value: `${(kpis.avgLatencyMs / 1000).toFixed(1)}s`,
      description: "P50 across workforce",
      trend: { dir: latencyTrendDir, text: latencyTrendText },
      period: "Last 30d",
    },
    {
      title: "Efficiency gain",
      value: `+${kpis.efficiencyGainPct.toFixed(1)}%`,
      description: "Vs. baseline workflow",
      trend: { dir: "up" as const, text: `+${kpis.efficiencyGainPct.toFixed(1)}pts` },
      period: "Last 30d",
    },
  ];
}

function Trend({ dir, text }: { dir: "up" | "down"; text: string }) {
  const up = dir === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        up ? "text-emerald-400/90" : "text-sky-400/90",
      )}
      aria-hidden
    >
      <span className="text-[10px]">{up ? "↑" : "↓"}</span>
      {text}
    </span>
  );
}

export function MetricsCards({ kpis }: { kpis: AnalyticsDashboardDTO["kpis"] }) {
  const metrics = buildMetrics(kpis);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.title} size="sm" className={cn(cardSurface)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {m.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <div className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-100">
                {m.value}
              </div>
              <Trend dir={m.trend.dir} text={m.trend.text} />
            </div>
            <p className="mt-1 text-xs text-neutral-500">{m.description}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-neutral-600">
              {m.period}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
