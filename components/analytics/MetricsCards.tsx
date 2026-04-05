import { analyticsCardClassName } from "@/components/analytics/analyticsSurface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

function formatCostUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

type TrendSpec = { dir: "up" | "down"; text: string };

function pctVsPrior30d(delta: number | null): TrendSpec | null {
  if (delta === null) return null;
  const good = delta >= 0;
  return {
    dir: good ? ("up" as const) : ("down" as const),
    text: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs prior 30d`,
  };
}

function latencyVsPrior(deltaMs: number | null): TrendSpec | null {
  if (deltaMs === null) return null;
  const faster = deltaMs <= 0;
  return {
    dir: faster ? ("down" as const) : ("up" as const),
    text:
      deltaMs === 0
        ? "0ms vs prior 30d"
        : `${deltaMs < 0 ? "−" : "+"}${Math.abs(deltaMs)}ms vs prior 30d`,
  };
}

function efficiencyPtsVsPrior(pts: number | null): TrendSpec | null {
  if (pts === null) return null;
  return {
    dir: pts >= 0 ? ("up" as const) : ("down" as const),
    text: `${pts >= 0 ? "+" : ""}${pts.toFixed(1)} pts vs prior 30d`,
  };
}

function buildMetrics(kpis: AnalyticsDashboardDTO["kpis"]) {
  return [
    {
      title: "Cost saved",
      value: formatCostUsd(kpis.costSavedUsd),
      description:
        "Sum of per-session savings fields on workspace sessions (shown as USD).",
      trend: pctVsPrior30d(kpis.costSavedTrendPct),
      period: "Last 30d",
    },
    {
      title: "Workspace sessions",
      value: kpis.sessionsHandled.toLocaleString(),
      description:
        "Distinct AI workspace sessions started in the rolling window (telemetry).",
      trend: pctVsPrior30d(kpis.sessionsTrendPct),
      period: "Last 30d",
    },
    {
      title: "Avg response time",
      value: `${(kpis.avgLatencyMs / 1000).toFixed(1)}s`,
      description: "Mean latency across recorded turns",
      trend: latencyVsPrior(kpis.latencyTrendMs),
      footnote: `Turn success ${kpis.successRatePct.toFixed(1)}% (successful vs failed chat turns)`,
      period: "Last 30d",
    },
    {
      title: "Efficiency gain",
      value: `+${kpis.efficiencyGainPct.toFixed(1)}%`,
      description:
        "Chat turn success rate vs. a configured baseline (default 85% on server).",
      trend: efficiencyPtsVsPrior(kpis.efficiencyTrendPts),
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

function TrendRow({ trend }: { trend: TrendSpec | null }) {
  if (!trend) {
    return (
      <span className="text-xs tabular-nums text-neutral-600">
        — vs prior 30d
      </span>
    );
  }
  return <Trend dir={trend.dir} text={trend.text} />;
}

export function MetricsCards({ kpis }: { kpis: AnalyticsDashboardDTO["kpis"] }) {
  const metrics = buildMetrics(kpis);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.title} size="sm" className={analyticsCardClassName()}>
          <CardHeader className="pb-1">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              {m.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <div className="text-xl font-semibold tabular-nums tracking-tight text-neutral-100">
                {m.value}
              </div>
              <TrendRow trend={m.trend} />
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-500">{m.description}</p>
            {"footnote" in m && m.footnote ? (
              <p className="mt-0.5 text-[10px] text-neutral-600">{m.footnote}</p>
            ) : null}
            <p className="mt-1.5 text-[10px] uppercase tracking-wide text-neutral-600">
              {m.period}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
