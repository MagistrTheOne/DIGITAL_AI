/**
 * Settings BFF → UI (no DB row types).
 */
export type SettingsAccountDTO = {
  name: string;
  email: string;
  image: string | null;
};

export type SettingsBillingDTO = {
  planLabel: string;
  sessionsUsed: number;
  sessionsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
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
