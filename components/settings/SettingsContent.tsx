"use client";

import { AccountSection } from "@/components/settings/AccountSection";
import { AiDefaultsSection } from "@/components/settings/AiDefaultsSection";
import { ArachneSection } from "@/components/settings/ArachneSection";
import { BillingSection } from "@/components/settings/BillingSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import type { SettingsSectionId } from "@/components/settings/types";

export function SettingsContent({ section }: { section: SettingsSectionId }) {
  switch (section) {
    case "account":
      return <AccountSection />;
    case "billing":
      return <BillingSection />;
    case "ai-defaults":
      return <AiDefaultsSection />;
    case "arachne-x":
      return <ArachneSection />;
    case "security":
      return <SecuritySection />;
    default:
      return null;
  }
}
