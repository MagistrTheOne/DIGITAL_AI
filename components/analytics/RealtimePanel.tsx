import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

/** Placeholder live signals — replace via BFF / WebSocket later. */
const LIVE_ROWS = [
  { label: "Active sessions", value: "2", status: "live" as const },
  { label: "Queue depth", value: "0", status: "ok" as const },
  { label: "Error rate (1h)", value: "0.2%", status: "ok" as const },
] as const;

export function RealtimePanel() {
  return (
    <Card size="sm" className={cn(cardSurface)}>
      <CardHeader>
        <CardTitle className="text-base text-neutral-100">Real-time overview</CardTitle>
        <CardDescription className="text-neutral-500">
          Live operations snapshot (placeholder).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {LIVE_ROWS.map((row, i) => (
          <div key={row.label}>
            {i > 0 ? <Separator className="mb-3 bg-neutral-800" /> : null}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-neutral-500">{row.label}</div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">
                  {row.value}
                </div>
              </div>
              <Badge
                variant={row.status === "live" ? "secondary" : "outline"}
                className={cn(
                  "shrink-0 border-neutral-700 text-[10px] uppercase tracking-wide",
                  row.status === "live" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
                )}
              >
                {row.status === "live" ? "Live" : "OK"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
