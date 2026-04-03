import { AppHeader } from "@/components/app/AppHeader";
import { BusinessImpactCard } from "@/components/analytics/BusinessImpactCard";
import { EmployeePerformanceList } from "@/components/analytics/EmployeePerformanceList";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { RealtimePanel } from "@/components/analytics/RealtimePanel";
import { TimelineMini } from "@/components/analytics/TimelineMini";
import { UsagePanel } from "@/components/analytics/UsagePanel";
import { WorkforceLevelCard } from "@/components/analytics/WorkforceLevelCard";
import { analyticsCardClassName } from "@/components/analytics/analyticsSurface";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AnalyticsDashboardDTO, UsagePlanLimits } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function speakingAvatarsFromEmployees(
  employees: AnalyticsDashboardDTO["employees"],
): { initials: string; name: string }[] {
  const active = employees.filter((e) => e.status === "active");
  const source = active.length > 0 ? active : employees;
  return source.slice(0, 3).map((e) => ({
    initials: initialsFromName(e.name),
    name: e.name.split(/\s+/)[0] ?? e.name,
  }));
}

export function AnalyticsPage({
  data,
  usageLimits,
}: {
  data: AnalyticsDashboardDTO;
  usageLimits: UsagePlanLimits;
}) {
  const speaking = speakingAvatarsFromEmployees(data.employees);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <AppHeader
          compact
          title="Analytics"
          subtitle="Capacity, cost, and reliability first — then per-agent operations."
        />
        <Alert
          className={cn(
            analyticsCardClassName(),
            "border-neutral-800/60 py-2.5 **:data-[slot=alert-description]:text-neutral-400",
          )}
          variant="default"
        >
          <AlertTitle className="sr-only">What this dashboard prioritizes</AlertTitle>
          <AlertDescription className="text-xs leading-snug">
            <span className="font-medium text-neutral-300">Business & enterprise focus:</span>{" "}
            plan usage and spend, SLA-style quality (success & latency), then live ops and
            workforce progression.
          </AlertDescription>
        </Alert>
      </div>

      <MetricsCards kpis={data.kpis} />

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <UsagePanel usage={data.usage} limits={usageLimits} />
        </div>
        <div className="lg:col-span-4">
          <BusinessImpactCard businessImpact={data.businessImpact} />
        </div>
        <div className="lg:col-span-3">
          <RealtimePanel
            realtime={data.realtime}
            speaking={speaking}
            voiceLoadPct={Math.min(100, Math.round(data.realtime.streamHealthPct))}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <EmployeePerformanceList employees={data.employees} />
        </div>
        <div className="flex flex-col gap-3 lg:col-span-4">
          <WorkforceLevelCard workforce={data.workforceLevel} />
          <TimelineMini timeline={data.timeline} />
        </div>
      </div>
    </div>
  );
}
