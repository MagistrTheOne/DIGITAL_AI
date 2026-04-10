/**
 * Runtime TTS/STT capability catalog (provider truth — no DB).
 * Client-safe: import only types from this file in `"use client"` modules.
 */

export type TtsLatencyLabel = "low" | "medium";
export type TtsQualityLabel = "standard" | "high";

export type OpenAiTtsRuntimeEntry = {
  models: string[];
  voices: string[];
  latency: TtsLatencyLabel;
  quality: TtsQualityLabel;
};

export type ElevenLabsTtsVoice = {
  id: string;
  name: string;
};

export type ElevenLabsProviderStatus = "ready" | "disabled" | "fallback";

export type ElevenLabsTtsRuntimeEntry = {
  voices: ElevenLabsTtsVoice[];
  models: string[];
  status: ElevenLabsProviderStatus;
};

export type RuntimeCatalog = {
  tts: {
    openai: OpenAiTtsRuntimeEntry;
    elevenlabs?: ElevenLabsTtsRuntimeEntry;
  };
  stt: {
    openai: {
      models: string[];
    };
  };
};

export type VoiceProviderId = "openai" | "elevenlabs";

export type RuntimeCatalogPayload = {
  catalog: RuntimeCatalog;
  /** True when synthesis used built-in OpenAI definitions only (e.g. error path). */
  isFallback: boolean;
  fetchedAt: string;
};

export type RuntimeHealthPayload = {
  openai: "ok" | "error";
  elevenlabs: "ok" | "disabled" | "degraded";
};
