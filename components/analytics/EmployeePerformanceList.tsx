"use client";

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
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

type AgentStatus = "active" | "idle" | "error";

/** Placeholder rows — replace via BFF later. */
const ROWS: Array<{
  name: string;
  sessions: number;
  successPct: number;
  latencyMs: number;
  status: AgentStatus;
}> = [
  { name: "Anna Vantage", sessions: 142, successPct: 98.2, latencyMs: 120, status: "active" },
  { name: "Marcus Vantage", sessions: 98, successPct: 96.4, latencyMs: 140, status: "idle" },
  { name: "Sofia Vantage", sessions: 201, successPct: 99.1, latencyMs: 90, status: "active" },
  { name: "James Vantage", sessions: 76, successPct: 94.0, latencyMs: 160, status: "error" },
];

const LATENCY_MAX_MS = 200;

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

export function EmployeePerformanceList() {
  return (
    <Card size="sm" className={cn(cardSurface)}>
      <CardHeader>
        <CardTitle className="text-base text-neutral-100">AI employee performance</CardTitle>
        <CardDescription className="text-neutral-500">
          Per-agent throughput, quality, and health (placeholder).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 px-0 pb-2">
        {ROWS.map((r, i) => (
          <div key={r.name}>
            {i > 0 ? <Separator className="bg-neutral-800" /> : null}
            <div className="grid gap-4 px-6 py-4 sm:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="truncate font-medium text-neutral-200">{r.name}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-sm tabular-nums text-neutral-400 sm:text-right">
                {r.sessions}{" "}
                <span className="text-neutral-600">sess.</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Success</span>
                  <span className="tabular-nums text-neutral-400">{r.successPct.toFixed(1)}%</span>
                </div>
                <Progress
                  value={r.successPct}
                  className="h-1 bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-neutral-500"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Latency</span>
                  <span className="tabular-nums text-neutral-400">
                    {(r.latencyMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (r.latencyMs / LATENCY_MAX_MS) * 100)}
                  className="h-1 bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-neutral-600"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
