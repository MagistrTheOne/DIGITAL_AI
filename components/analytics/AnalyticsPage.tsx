import { AppHeader } from "@/components/app/AppHeader";

import { EmployeePerformanceTable } from "@/components/analytics/EmployeePerformanceTable";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { RealtimePanel } from "@/components/analytics/RealtimePanel";
import { UsagePanel } from "@/components/analytics/UsagePanel";

/**
 * AI workforce analytics shell — static placeholders until BFF wiring.
 */
export function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8">
      <AppHeader
        title="Analytics"
        subtitle="AI workforce performance, usage, and operational health"
      />

      <MetricsCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmployeePerformanceTable />
        </div>
        <div className="flex flex-col gap-6">
          <RealtimePanel />
        </div>
      </div>

      <UsagePanel />
    </div>
  );
}
