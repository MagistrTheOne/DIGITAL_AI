import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

/** Placeholder KPIs — replace via BFF later. */
const METRICS = [
  {
    title: "Cost saved",
    value: "$12.4k",
    description: "Vs. equivalent human labor (est.)",
    trend: { dir: "up" as const, text: "+12%" },
    period: "Last 7d",
  },
  {
    title: "Sessions handled",
    value: "1,842",
    description: "Rolling window",
    trend: { dir: "up" as const, text: "+18%" },
    period: "Last 24h",
  },
  {
    title: "Avg response time",
    value: "1.1s",
    description: "P50 across workforce",
    trend: { dir: "down" as const, text: "−120ms" },
    period: "Last 24h",
  },
  {
    title: "Efficiency gain",
    value: "+18%",
    description: "Vs. baseline workflow",
    trend: { dir: "up" as const, text: "+4pts" },
    period: "Last 7d",
  },
] as const;

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

export function MetricsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map((m) => (
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
