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
  },
  {
    title: "Sessions handled",
    value: "1,842",
    description: "Last 30 days",
  },
  {
    title: "Avg response time",
    value: "1.1s",
    description: "P50 across workforce",
  },
  {
    title: "Efficiency gain",
    value: "+18%",
    description: "Vs. baseline workflow",
  },
] as const;

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
            <div className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-100">
              {m.value}
            </div>
            <p className="mt-1 text-xs text-neutral-500">{m.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
