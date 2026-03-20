import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

export function TimelineMini({
  timeline,
}: {
  timeline: AnalyticsDashboardDTO["timeline"];
}) {
  const maxCount = Math.max(1, ...timeline.map((t) => t.sessionsCount));

  return (
    <Card size="sm" className={cn(cardSurface)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-neutral-100">Sessions (24h)</CardTitle>
        <CardDescription className="text-neutral-500">
          Hourly activity shape — no chart library.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-14 items-end justify-between gap-1 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-2"
          role="img"
          aria-label="Session activity last 24 hours"
        >
          {timeline.map((t) => {
            const h = maxCount > 0 ? t.sessionsCount / maxCount : 0;
            return (
              <div
                key={t.hourIndex}
                className="w-full max-w-[12%] rounded-sm bg-neutral-600"
                style={{ height: `${Math.max(8, h * 100)}%` }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-neutral-600">
          <span>−24h</span>
          <span>Now</span>
        </div>
      </CardContent>
    </Card>
  );
}
