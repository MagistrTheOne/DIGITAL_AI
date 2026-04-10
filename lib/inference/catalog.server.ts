/**
 * Runtime catalog for speech capabilities (OpenAI + ElevenLabs).
 * Static OpenAI lists; ElevenLabs voices from GET /v1/voices when API key is set.
 */
import { fetchElevenLabsTtsRuntimeEntry } from "@/lib/inference/providers/elevenlabs.server";
import {
  ELEVENLABS_TTS_MODEL_IDS,
  LEGACY_STT_MODELS,
  LEGACY_TTS_VOICES,
  OPENAI_STT_MODEL_IDS,
  OPENAI_TTS_MODEL_IDS,
  OPENAI_TTS_VOICE_IDS,
} from "@/lib/inference/runtime-catalog.constants";
import type {
  ElevenLabsTtsRuntimeEntry,
  OpenAiTtsRuntimeEntry,
  RuntimeCatalog,
  RuntimeCatalogPayload,
} from "@/lib/inference/runtime-catalog.types";

const OPENAI_TTS_BLOCK: OpenAiTtsRuntimeEntry = {
  models: [...OPENAI_TTS_MODEL_IDS],
  voices: [...OPENAI_TTS_VOICE_IDS],
  latency: "low",
  quality: "high",
};

/** Sync catalog slice when no ElevenLabs network call (error handler / SSR-safe merge). */
const ELEVENLABS_DISABLED_ENTRY: ElevenLabsTtsRuntimeEntry = {
  voices: [],
  models: [...ELEVENLABS_TTS_MODEL_IDS],
  status: "disabled",
};

/** Catalog when OpenAI is assembled without live ElevenLabs fetch. */
export function buildPrimaryRuntimeCatalog(): RuntimeCatalog {
  return {
    tts: {
      openai: OPENAI_TTS_BLOCK,
      elevenlabs: ELEVENLABS_DISABLED_ENTRY,
    },
    stt: {
      openai: {
        models: [...OPENAI_STT_MODEL_IDS],
      },
    },
  };
}

function buildFallbackRuntimeCatalog(): RuntimeCatalog {
  return {
    tts: {
      openai: {
        models: [...OPENAI_TTS_MODEL_IDS],
        voices: [...OPENAI_TTS_VOICE_IDS, ...LEGACY_TTS_VOICES],
        latency: "low",
        quality: "high",
      },
      elevenlabs: ELEVENLABS_DISABLED_ENTRY,
    },
    stt: {
      openai: {
        models: [...OPENAI_STT_MODEL_IDS, ...LEGACY_STT_MODELS],
      },
    },
  };
}

export async function getRuntimeCatalog(): Promise<RuntimeCatalog> {
  const elevenlabs = await fetchElevenLabsTtsRuntimeEntry();
  return {
    tts: {
      openai: OPENAI_TTS_BLOCK,
      elevenlabs,
    },
    stt: {
      openai: {
        models: [...OPENAI_STT_MODEL_IDS],
      },
    },
  };
}

export function getRuntimeCatalogPayloadSync(
  isFallback: boolean,
): RuntimeCatalogPayload {
  return {
    catalog: isFallback
      ? buildFallbackRuntimeCatalog()
      : buildPrimaryRuntimeCatalog(),
    isFallback,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getRuntimeCatalogPayload(): Promise<RuntimeCatalogPayload> {
  try {
    const catalog = await getRuntimeCatalog();
    return {
      catalog,
      isFallback: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return getRuntimeCatalogPayloadSync(true);
  }
}
