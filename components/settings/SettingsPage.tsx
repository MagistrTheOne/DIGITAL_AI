"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { AppHeader } from "@/components/app/AppHeader";
import { SETTINGS_NAV } from "@/components/settings/constants";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { SettingsProvider } from "@/components/settings/settings-context";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import type { SettingsSectionId } from "@/components/settings/types";
import type { SettingsDTO } from "@/features/settings/types";

function sectionFromQuery(raw: string | null): SettingsSectionId {
  if (raw && SETTINGS_NAV.some((n) => n.id === raw)) {
    return raw as SettingsSectionId;
  }
  return "account";
}

export function SettingsPage({ initialData }: { initialData: SettingsDTO }) {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const urlSection = sectionFromQuery(sectionParam);
  const [section, setSection] =
    React.useState<SettingsSectionId>(urlSection);

  React.useEffect(() => {
    setSection(sectionFromQuery(sectionParam));
  }, [sectionParam]);

  const activeMeta = SETTINGS_NAV.find((n) => n.id === section);

  return (
    <SettingsProvider value={initialData}>
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <AppHeader
          compact
          title="Settings"
          subtitle="Identity, billing, defaults, and runtime."
        />

        <div className="flex min-h-[min(70vh,860px)] flex-col gap-6 lg:flex-row lg:gap-6">
          <SettingsSidebar active={section} onSelect={setSection} />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="lg:hidden">
              <p className="text-xs text-neutral-500">{activeMeta?.description}</p>
            </div>
            <SettingsContent section={section} />
          </div>
        </div>
      </div>
    </SettingsProvider>
  );
}
