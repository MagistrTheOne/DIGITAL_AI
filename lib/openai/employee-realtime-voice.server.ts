import OpenAI from "openai";

import { buildEmployeeSystemPrompt } from "@/lib/openai/employee-chat.server";
import type { EmployeeConfigJson } from "@/services/db/repositories/employees.repository";

const DEFAULT_REALTIME_MODEL = "gpt-realtime-1.5";

/** Push-to-talk: mic segment ends on button; then commit + response. VAD: stream mic; server detects end of speech and replies (closer to “live” talk). */
export type RealtimeVoiceTurnMode = "push" | "vad";

export function getRealtimeVoiceModel(): string {
  const m = process.env.NULLXES_REALTIME_MODEL?.trim();
  return m || DEFAULT_REALTIME_MODEL;
}

/**
 * Default `push`: tap again to finish your phrase (no auto-cut on pause).
 * Hands-free / full duplex: `vad`, `live`, `continuous`, `full`, `realtime`, `handsfree`, `duplex`.
 */
export function getRealtimeVoiceTurnMode(): RealtimeVoiceTurnMode {
  const v = process.env.NULLXES_REALTIME_VOICE_MODE?.trim().toLowerCase();
  if (
    v === "vad" ||
    v === "live" ||
    v === "continuous" ||
    v === "full" ||
    v === "realtime" ||
    v === "handsfree" ||
    v === "duplex"
  ) {
    return "vad";
  }
  return "push";
}

type RealtimeTurnDetection =
  | {
      type: "server_vad";
      create_response: boolean;
      interrupt_response: boolean;
      silence_duration_ms: number;
      prefix_padding_ms: number;
      threshold?: number;
    }
  | {
      type: "semantic_vad";
      create_response: boolean;
      interrupt_response: boolean;
      eagerness?: "low" | "medium" | "high" | "auto";
    };

/** `semantic` (default): model-based end-of-turn — better for natural pauses. `server`: classic silence VAD. */
function getRealtimeVadEngine(): "semantic" | "server" {
  const v = process.env.NULLXES_REALTIME_VAD_ENGINE?.trim().toLowerCase();
  if (v === "server" || v === "classic" || v === "energy") return "server";
  return "semantic";
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function buildRealtimeTurnDetection(): RealtimeTurnDetection {
  const engine = getRealtimeVadEngine();
  if (engine === "server") {
    const silence = clamp(
      parsePositiveInt(process.env.NULLXES_REALTIME_SILENCE_MS, 600),
      200,
      2000,
    );
    const prefix = clamp(
      parsePositiveInt(process.env.NULLXES_REALTIME_PREFIX_PADDING_MS, 300),
      0,
      1000,
    );
    const thrRaw = process.env.NULLXES_REALTIME_VAD_THRESHOLD?.trim();
    const thresholdParsed =
      thrRaw !== undefined && thrRaw !== ""
        ? Number.parseFloat(thrRaw)
        : undefined;
    const threshold =
      thresholdParsed !== undefined &&
      Number.isFinite(thresholdParsed) &&
      thresholdParsed >= 0 &&
      thresholdParsed <= 1
        ? thresholdParsed
        : undefined;
    return {
      type: "server_vad",
      create_response: true,
      interrupt_response: true,
      silence_duration_ms: silence,
      prefix_padding_ms: prefix,
      ...(threshold !== undefined ? { threshold } : {}),
    };
  }

  const e = process.env.NULLXES_REALTIME_SEMANTIC_EAGERNESS?.trim().toLowerCase();
  const eagerness =
    e === "low" || e === "medium" || e === "high" || e === "auto"
      ? e
      : "low";

  return {
    type: "semantic_vad",
    create_response: true,
    interrupt_response: true,
    eagerness,
  };
}

function getInputTranscriptionConfig(): { model: string; language?: string } {
  const model =
    process.env.NULLXES_REALTIME_TRANSCRIBE_MODEL?.trim() || "whisper-1";
  const lang = process.env.NULLXES_REALTIME_INPUT_LANG?.trim();
  return lang ? { model, language: lang } : { model };
}

export type RealtimeAssistantOutput = "audio" | "text";

export async function mintEmployeeRealtimeClientSecret(input: {
  displayName: string;
  role: string;
  config: EmployeeConfigJson;
  /** `text` = sync/lip-sync path (no model audio); `audio` = default Realtime voice. */
  assistantOutput?: RealtimeAssistantOutput;
}): Promise<{
  clientSecret: string;
  expiresAt: number;
  model: string;
  voiceMode: RealtimeVoiceTurnMode;
}> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey });
  const model = getRealtimeVoiceModel();
  const voiceRaw = process.env.NULLXES_REALTIME_VOICE_ID?.trim();
  const voice = voiceRaw || "marin";
  const turnMode = getRealtimeVoiceTurnMode();
  const assistantOutput: RealtimeAssistantOutput =
    input.assistantOutput ?? "audio";

  const instructions =
    buildEmployeeSystemPrompt(input.displayName, input.role, input.config) +
    (assistantOutput === "text"
      ? "\n\nText session: reply in short, natural sentences suitable for speech synthesis; no markdown unless asked."
      : "\n\nVoice session: answer in short, natural spoken sentences unless the user asks for depth or lists.");

  const audioInput = {
    format: { type: "audio/pcm" as const, rate: 24000 as const },
    turn_detection: turnMode === "vad" ? buildRealtimeTurnDetection() : null,
    transcription: getInputTranscriptionConfig(),
    noise_reduction: { type: "far_field" as const },
  };

  const sessionPayload =
    assistantOutput === "text"
      ? {
          type: "realtime" as const,
          model,
          instructions,
          output_modalities: ["text"] as Array<"text" | "audio">,
          audio: {
            input: audioInput,
          },
        }
      : {
          type: "realtime" as const,
          model,
          instructions,
          output_modalities: ["audio"] as Array<"text" | "audio">,
          audio: {
            input: audioInput,
            output: {
              format: { type: "audio/pcm" as const, rate: 24000 as const },
              voice,
            },
          },
        };

  const created = await openai.realtime.clientSecrets.create({
    expires_after: { anchor: "created_at", seconds: 600 },
    session: sessionPayload,
  });

  return {
    clientSecret: created.value,
    expiresAt: created.expires_at,
    model,
    voiceMode: turnMode,
  };
}
