/**
 * Shared OpenAI speech capability ids (docs: /v1/audio/speech, transcriptions).
 * Safe for client and server.
 */

export const OPENAI_TTS_MODEL_IDS = [
  "gpt-4o-mini-tts",
  "tts-1",
  "tts-1-hd",
] as const;

export const OPENAI_TTS_VOICE_IDS = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
] as const;

export const OPENAI_STT_MODEL_IDS = [
  "whisper-1",
  "gpt-4o-transcribe",
  "gpt-4o-mini-transcribe",
] as const;

/**
 * ElevenLabs TTS `model_id` values (flagship + latency tiers).
 * @see https://elevenlabs.io/docs/overview/models — prefer Flash over deprecated Turbo.
 */
export const ELEVENLABS_TTS_MODEL_IDS = [
  "eleven_flash_v2_5",
  "eleven_flash_v2",
  "eleven_multilingual_v2",
  "eleven_v3",
] as const;

const ELEVENLABS_MODEL_SET = new Set<string>(ELEVENLABS_TTS_MODEL_IDS);

export function isAllowedElevenLabsTtsModelId(id: string): boolean {
  return ELEVENLABS_MODEL_SET.has(id);
}

export const LEGACY_TTS_VOICES = ["sol"] as const;
export const LEGACY_STT_MODELS = [
  "whisper-large",
  "whisper-medium",
  "scribe-v1",
] as const;
