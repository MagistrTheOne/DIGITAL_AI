import {
  ELEVENLABS_TTS_MODEL_IDS,
  LEGACY_STT_MODELS,
  LEGACY_TTS_VOICES,
  OPENAI_STT_MODEL_IDS,
  OPENAI_TTS_MODEL_IDS,
  OPENAI_TTS_VOICE_IDS,
} from "@/lib/inference/runtime-catalog.constants";
import type {
  RuntimeCatalog,
  RuntimeCatalogPayload,
} from "@/lib/inference/runtime-catalog.types";

function primaryCatalog(): RuntimeCatalog {
  return {
    tts: {
      openai: {
        models: [...OPENAI_TTS_MODEL_IDS],
        voices: [...OPENAI_TTS_VOICE_IDS],
        latency: "low",
        quality: "high",
      },
      elevenlabs: {
        voices: [],
        models: [...ELEVENLABS_TTS_MODEL_IDS],
        status: "disabled",
      },
    },
    stt: {
      openai: {
        models: [...OPENAI_STT_MODEL_IDS],
      },
    },
  };
}

/** Matches server `buildFallbackRuntimeCatalog` for offline / failed fetch. */
function fallbackCatalog(): RuntimeCatalog {
  return {
    tts: {
      openai: {
        models: [...OPENAI_TTS_MODEL_IDS],
        voices: [...OPENAI_TTS_VOICE_IDS, ...LEGACY_TTS_VOICES],
        latency: "low",
        quality: "high",
      },
      elevenlabs: {
        voices: [],
        models: [...ELEVENLABS_TTS_MODEL_IDS],
        status: "disabled",
      },
    },
    stt: {
      openai: {
        models: [...OPENAI_STT_MODEL_IDS, ...LEGACY_STT_MODELS],
      },
    },
  };
}

export function createClientRuntimeCatalogPayload(
  mode: "primary" | "fallback",
): RuntimeCatalogPayload {
  return {
    catalog: mode === "fallback" ? fallbackCatalog() : primaryCatalog(),
    isFallback: mode === "fallback",
    fetchedAt: new Date().toISOString(),
  };
}
