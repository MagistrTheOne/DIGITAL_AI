import { AppHeader } from "@/components/app/AppHeader";

import { BusinessImpactCard } from "@/components/analytics/BusinessImpactCard";
import { EmployeePerformanceList } from "@/components/analytics/EmployeePerformanceList";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { RealtimePanel } from "@/components/analytics/RealtimePanel";
import { TimelineMini } from "@/components/analytics/TimelineMini";
import { UsagePanel } from "@/components/analytics/UsagePanel";
import { WorkforceLevelCard } from "@/components/analytics/WorkforceLevelCard";

/**
 * AI operations control panel — placeholder data until BFF wiring.
 */
export function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8">
      <AppHeader
        title="Analytics"
        subtitle="Operate, level up, and monetize your AI workforce"
      />

      <MetricsCards />

      <WorkforceLevelCard />

      <UsagePanel />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmployeePerformanceList />
        </div>
        <div className="flex flex-col gap-6">
          <RealtimePanel />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BusinessImpactCard />
        <TimelineMini />
      </div>
    </div>
  );
}
