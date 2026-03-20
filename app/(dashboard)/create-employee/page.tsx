import * as React from "react";

import { AppHeader } from "@/components/app/AppHeader";

export default function CreateEmployeePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AppHeader title="Create Employee" subtitle="Onboard a new digital workforce member" />
      <div className="rounded-xl border bg-card p-6">
        <div className="text-sm text-muted-foreground">
          Create Employee placeholder (implemented in `features/employees` mutations).
        </div>
      </div>
    </div>
  );
}

