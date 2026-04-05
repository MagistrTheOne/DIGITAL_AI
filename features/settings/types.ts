import type { PlanType } from "@/features/account/types";

/**
 * Settings BFF → UI (no DB row types).
 */
export type SettingsAccountDTO = {
  name: string;
  email: string;
  image: string | null;
  /** From sign-up; not editable in UI until a profile API exists. */
  organization: string | null;
};

export type SettingsBillingDTO = {
  planType: PlanType;
  planLabel: string;
  sessionsUsed: number;
  sessionsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  /** Polar Pro checkout (token + Pro product id(s)). */
  polarProCheckoutEnabled: boolean;
  /** Polar Enterprise product checkout. */
  polarEnterpriseCheckoutEnabled: boolean;
  /** Polar customer portal (env: token). */
  polarPortalEnabled: boolean;
};

export type SettingsAiDefaultsDTO = {
  tone: string;
  language: string;
  voiceEnabled: boolean;
  latencyVsQuality: number;
};

export type SettingsArachneDTO = {
  streaming: boolean;
  avatarQuality: string;
  ttsVoice: string;
  sttModel: string;
};

export type SettingsDTO = {
  account: SettingsAccountDTO;
  billing: SettingsBillingDTO;
  aiDefaults: SettingsAiDefaultsDTO;
  arachne: SettingsArachneDTO;
};

export type UpdateAiDefaultsInput = {
  tone?: string;
  language?: string;
  voiceEnabled?: boolean;
  latencyVsQuality?: number;
};

export type UpdateArachneInput = {
  streaming?: boolean;
  avatarQuality?: string;
  ttsVoice?: string;
  sttModel?: string;
};
