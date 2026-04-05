"use client";

import { analyticsCardClassName } from "@/components/analytics/analyticsSurface";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

const LATENCY_MAX_MS = 2000;

type AgentStatus = AnalyticsDashboardDTO["employees"][number]["status"];

function StatusBadge({ status }: { status: AgentStatus }) {
  const cfg = {
    active: {
      label: "Active",
      className:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    },
    idle: {
      label: "Idle",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    },
    error: {
      label: "Error",
      className: "border-red-500/40 bg-red-500/15 text-red-300",
    },
  }[status];

  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide", cfg.className)}>
      <span
        className={cn(
          "mr-1 inline-block size-1.5 rounded-full",
          status === "active" && "bg-emerald-400",
          status === "idle" && "bg-amber-400",
          status === "error" && "bg-red-400",
        )}
        aria-hidden
      />
      {cfg.label}
    </Badge>
  );
}

export function EmployeePerformanceList({
  employees,
}: {
  employees: AnalyticsDashboardDTO["employees"];
}) {
  return (
    <Card size="sm" className={analyticsCardClassName()}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-neutral-100">Per-employee operations</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Transcript sessions per agent, turn success rate, and mean latency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 px-0 pb-1">
        {employees.length === 0 ? (
          <p className="px-4 py-4 text-xs text-neutral-500">No employee telemetry yet.</p>
        ) : (
          employees.map((r, i) => (
            <div key={r.employeeId}>
              {i > 0 ? <Separator className="bg-neutral-800/80" /> : null}
              <div className="grid gap-3 px-4 py-2.5 sm:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="truncate font-medium text-neutral-200">{r.name}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-xs tabular-nums text-neutral-400 sm:text-right">
                  {r.sessions}{" "}
                  <span className="text-neutral-600">transcripts</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>Success</span>
                    <span className="tabular-nums text-neutral-400">
                      {r.successRatePct.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, r.successRatePct)}
                    className="h-1 bg-neutral-800 **:data-[slot=progress-indicator]:bg-neutral-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>Latency</span>
                    <span className="tabular-nums text-neutral-400">
                      {(r.avgLatencyMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (r.avgLatencyMs / LATENCY_MAX_MS) * 100)}
                    className="h-1 bg-neutral-800 **:data-[slot=progress-indicator]:bg-neutral-600"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
