"use client";

import { analyticsCardClassName } from "@/components/analytics/analyticsSurface";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

export function RealtimePanel({
  realtime,
  speaking,
  throughputLoadPct,
}: {
  realtime: AnalyticsDashboardDTO["realtime"];
  speaking: { initials: string; name: string }[];
  /** Visual load from event rate (not voice); see Live panel description. */
  throughputLoadPct: number;
}) {
  const metrics = [
    {
      label: "Active sessions",
      value: String(realtime.activeSessions),
      badge: "live" as const,
    },
    {
      label: "Events / sec",
      value: realtime.eventsPerSecond.toFixed(2),
      badge: "ok" as const,
    },
    {
      label: "Turn success (1h)",
      value: `${realtime.streamHealthPct.toFixed(1)}%`,
      badge: "ok" as const,
    },
  ];

  const avatars =
    speaking.length > 0
      ? speaking
      : [{ initials: "—", name: "—" }, { initials: "—", name: "—" }, { initials: "—", name: "—" }];

  return (
    <Card
      size="sm"
      className={cn(analyticsCardClassName(), "border-emerald-500/15")}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-neutral-100">Live operations</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Active transcript sessions (recent), usage event rate, last-hour turn success.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {metrics.map((row, i) => (
          <div key={row.label}>
            {i > 0 ? <Separator className="mb-2.5 bg-neutral-800/80" /> : null}
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] text-neutral-500">{row.label}</div>
                <div className="mt-0.5 text-base font-semibold tabular-nums text-neutral-100">
                  {row.value}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 border text-[10px] uppercase tracking-wide",
                  row.badge === "live" &&
                    "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
                  row.badge === "ok" &&
                    "border-neutral-600 bg-neutral-900 text-neutral-400",
                )}
              >
                {row.badge === "live" ? "Live" : "OK"}
              </Badge>
            </div>
          </div>
        ))}

        <Separator className="bg-neutral-800/80" />

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-500">Speaking now</span>
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">
              Avatars
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {avatars.slice(0, 3).map((a, idx) => (
                <span key={`${a.name}-${idx}`} title={a.name} className="inline-flex">
                  <Avatar
                    size="sm"
                    className="border-2 border-neutral-950 ring-1 ring-emerald-500/30"
                  >
                    <AvatarFallback className="bg-neutral-800 text-[10px] font-medium text-neutral-200">
                      {a.initials}
                    </AvatarFallback>
                  </Avatar>
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Throughput load</span>
                <span className="tabular-nums text-neutral-400">
                  {Math.round(throughputLoadPct)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, throughputLoadPct)}
                className="h-1.5 bg-neutral-800 **:data-[slot=progress-indicator]:bg-emerald-500/70"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
