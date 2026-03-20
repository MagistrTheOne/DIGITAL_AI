import { AppHeader } from "@/components/app/AppHeader";

import { BusinessImpactCard } from "@/components/analytics/BusinessImpactCard";
import { EmployeePerformanceList } from "@/components/analytics/EmployeePerformanceList";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { RealtimePanel } from "@/components/analytics/RealtimePanel";
import { TimelineMini } from "@/components/analytics/TimelineMini";
import { UsagePanel } from "@/components/analytics/UsagePanel";
import { WorkforceLevelCard } from "@/components/analytics/WorkforceLevelCard";
import type { AnalyticsDashboardDTO, UsagePlanLimits } from "@/features/analytics/types";

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
    <div className="flex flex-col gap-8">
      <AppHeader
        title="Analytics"
        subtitle="Operate, level up, and monetize your AI workforce"
      />

      <MetricsCards kpis={data.kpis} />

      <WorkforceLevelCard workforce={data.workforceLevel} />

      <UsagePanel usage={data.usage} limits={usageLimits} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmployeePerformanceList employees={data.employees} />
        </div>
        <div className="flex flex-col gap-6">
          <RealtimePanel
            realtime={data.realtime}
            speaking={speaking}
            voiceLoadPct={Math.min(100, Math.round(data.realtime.streamHealthPct))}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BusinessImpactCard businessImpact={data.businessImpact} />
        <TimelineMini timeline={data.timeline} />
      </div>
    </div>
  );
}
