import type { AvatarVoiceMode } from "@/features/employees/avatar-voice.types";

/**
 * Server-side source of truth for voice UX (client receives via bootstrap only).
 * `sync` = OpenAI text-only + ElevenLabs + InfiniteTalk (one audio source).
 */
export function getAvatarVoiceModeFromEnv(): AvatarVoiceMode {
  const v = process.env.NULLXES_AVATAR_VOICE_MODE?.trim().toLowerCase();
  if (v === "sync" || v === "lipsync" || v === "lip-sync") return "sync";
  return "realtime";
}
