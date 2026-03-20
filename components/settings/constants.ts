import type { SettingsSectionId } from "@/components/settings/types";

export const SETTINGS_NAV: Array<{
  id: SettingsSectionId;
  label: string;
  description: string;
}> = [
  { id: "account", label: "Account", description: "Profile & identity" },
  { id: "billing", label: "Billing", description: "Plan & usage" },
  { id: "ai-defaults", label: "AI Defaults", description: "Tone & behavior" },
  { id: "arachne-x", label: "Arachne-X", description: "Runtime & media" },
  { id: "security", label: "Security", description: "Sessions & keys" },
];
