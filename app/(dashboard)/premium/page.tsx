import * as React from "react";

import { AppHeader } from "@/components/app/AppHeader";

export default function PremiumPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AppHeader title="Premium" subtitle="Billing, subscription, and plan upgrades" />
      <div className="rounded-xl border bg-card p-6">
        <div className="text-sm text-muted-foreground">
          Premium placeholder (implemented in `features/billing`).
        </div>
      </div>
    </div>
  );
}

