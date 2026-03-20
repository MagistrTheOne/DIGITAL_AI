"use client";

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

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

export function RealtimePanel({
  realtime,
  speaking,
  voiceLoadPct,
}: {
  realtime: AnalyticsDashboardDTO["realtime"];
  speaking: { initials: string; name: string }[];
  voiceLoadPct: number;
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
      label: "Stream health",
      value: `${realtime.streamHealthPct.toFixed(1)}%`,
      badge: "ok" as const,
    },
  ];

  const avatars =
    speaking.length > 0
      ? speaking
      : [{ initials: "—", name: "—" }, { initials: "—", name: "—" }, { initials: "—", name: "—" }];

  return (
    <Card size="sm" className={cn(cardSurface, "border-emerald-500/10")}>
      <CardHeader>
        <CardTitle className="text-base text-neutral-100">Real-time system status</CardTitle>
        <CardDescription className="text-neutral-500">
          Live throughput and voice streams.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((row, i) => (
          <div key={row.label}>
            {i > 0 ? <Separator className="mb-4 bg-neutral-800" /> : null}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-neutral-500">{row.label}</div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">
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

        <Separator className="bg-neutral-800" />

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">Speaking now</span>
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
                <span>Voice stream load</span>
                <span className="tabular-nums text-neutral-400">
                  {Math.round(voiceLoadPct)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, voiceLoadPct)}
                className="h-1.5 bg-neutral-800 **:data-[slot=progress-indicator]:bg-emerald-500/70"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
