/**
 * ElevenLabs runtime TTS catalog (server-only). Uses GET /v1/voices; never expose xi-api-key to clients.
 * @see https://elevenlabs.io/docs/api-reference/voices/get-all
 */
import { ELEVENLABS_TTS_MODEL_IDS } from "@/lib/inference/runtime-catalog.constants";
import type {
  ElevenLabsTtsRuntimeEntry,
  ElevenLabsTtsVoice,
} from "@/lib/inference/runtime-catalog.types";

const VOICES_URL = "https://api.elevenlabs.io/v1/voices";
const VOICES_CACHE_TTL_MS = 10 * 60 * 1000;

const ELEVENLABS_MODELS: string[] = [...ELEVENLABS_TTS_MODEL_IDS];

type VoicesApiVoice = {
  voice_id?: string;
  name?: string;
};

type VoicesApiResponse = {
  voices?: VoicesApiVoice[];
};

let voicesCache: { voices: ElevenLabsTtsVoice[]; expiresAt: number } | null =
  null;

/** `undefined` = no completed fetch with key yet; `false` = last fetch failed. */
let lastVoicesFetchOk: boolean | undefined = undefined;

export function getElevenLabsLastVoicesFetchOk(): boolean | undefined {
  return lastVoicesFetchOk;
}

function elevenLabsApiKey(): string | undefined {
  return process.env.ELEVENLABS_API_KEY?.trim() || undefined;
}

function mapVoicesPayload(data: unknown): ElevenLabsTtsVoice[] {
  if (!data || typeof data !== "object") return [];
  const voices = (data as VoicesApiResponse).voices;
  if (!Array.isArray(voices)) return [];
  const out: ElevenLabsTtsVoice[] = [];
  for (const v of voices) {
    if (!v || typeof v !== "object") continue;
    const id = typeof v.voice_id === "string" ? v.voice_id.trim() : "";
    if (!id) continue;
    const name =
      typeof v.name === "string" && v.name.trim()
        ? v.name.trim()
        : id;
    out.push({ id, name });
  }
  return out;
}

async function fetchVoicesFromApi(
  apiKey: string,
): Promise<ElevenLabsTtsVoice[]> {
  const res = await fetch(VOICES_URL, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs voices HTTP ${res.status}`);
  }

  const json: unknown = await res.json();
  return mapVoicesPayload(json);
}

/**
 * Returns ElevenLabs TTS catalog slice for runtime merge.
 * - No `ELEVENLABS_API_KEY`: disabled, no network.
 * - Success: ready + cached voices 10m.
 * - Failure: fallback, empty voices, models still listed for UI hints.
 */
export async function fetchElevenLabsTtsRuntimeEntry(): Promise<ElevenLabsTtsRuntimeEntry> {
  const key = elevenLabsApiKey();
  if (!key) {
    return {
      voices: [],
      models: ELEVENLABS_MODELS,
      status: "disabled",
    };
  }

  const now = Date.now();
  if (voicesCache && voicesCache.expiresAt > now) {
    lastVoicesFetchOk = true;
    return {
      voices: voicesCache.voices,
      models: ELEVENLABS_MODELS,
      status: "ready",
    };
  }

  try {
    const voices = await fetchVoicesFromApi(key);
    voicesCache = {
      voices,
      expiresAt: now + VOICES_CACHE_TTL_MS,
    };
    lastVoicesFetchOk = true;
    return {
      voices,
      models: ELEVENLABS_MODELS,
      status: "ready",
    };
  } catch {
    lastVoicesFetchOk = false;
    return {
      voices: [],
      models: ELEVENLABS_MODELS,
      status: "fallback",
    };
  }
}
