/** Server-only: employee page Realtime voice (mic + TTS). */
export function isNullxesRealtimeVoiceEnvEnabled(): boolean {
  const v = process.env.NULLXES_REALTIME_VOICE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
