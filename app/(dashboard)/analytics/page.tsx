import * as React from "react";

import { AppHeader } from "@/components/app/AppHeader";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AppHeader title="Analytics" subtitle="Understand performance and usage" />
      <div className="rounded-xl border bg-card p-6">
        <div className="text-sm text-muted-foreground">
          Analytics placeholder (implemented in `features/analytics`).
        </div>
      </div>
    </div>
  );
}

