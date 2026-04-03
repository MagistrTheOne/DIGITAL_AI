import { analyticsCardClassName } from "@/components/analytics/analyticsSurface";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";

export function TimelineMini({
  timeline,
}: {
  timeline: AnalyticsDashboardDTO["timeline"];
}) {
  const maxCount = Math.max(1, ...timeline.map((t) => t.sessionsCount));

  return (
    <Card size="sm" className={analyticsCardClassName()}>
      <CardHeader className="pb-1.5">
        <CardTitle className="text-sm text-neutral-100">Sessions (24h)</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Hourly shape — operational context.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="flex h-11 items-end justify-between gap-1 rounded-md border border-neutral-800/80 bg-neutral-950/50 px-2 py-1.5"
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
