import * as React from "react";

import { AppHeader } from "@/components/app/AppHeader";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AppHeader title="Settings" subtitle="Manage your platform preferences" />
      <div className="rounded-xl border bg-card p-6">
        <div className="text-sm text-muted-foreground">
          Settings placeholder.
        </div>
      </div>
    </div>
  );
}

