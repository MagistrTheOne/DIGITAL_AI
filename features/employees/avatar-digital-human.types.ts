import type { VoiceUiState } from "@/components/employee-interaction/types";

/**
 * Unified UX state: realtime perception (voice + static/loop) first;
 * RunPod video is async enhancement — never blocks audio.
 */
export type AvatarState =
  | "idle"
  | "listening"
  | "speaking_audio"
  | "rendering_video"
  | "video_ready";

export type VideoSegmentStatus = "pending" | "ready";

/**
 * One logical assistant utterance mapped to optional RunPod segment video.
 * Audio is always driven by OpenAI Realtime (or chat); this tracks visual sync only.
 */
export type VideoSegment = {
  sequence: number;
  status: VideoSegmentStatus;
  /** Primary (realtime tier) muted overlay URL when ready */
  videoUrl?: string;
  /** Optional hybrid enhanced layer */
  enhancedUrl?: string;
};

/** Target ~2–4s ElevenLabs audio for session segments (cost + latency guard). */
export const AVATAR_SEGMENT_TEXT_MAX_CHARS = 320;

export function deriveAvatarPresentationState(input: {
  voiceState: VoiceUiState;
  pipelineEnabled: boolean;
  videoSegment: VideoSegment | null;
}): AvatarState {
  if (input.voiceState === "recording") return "listening";
  if (input.voiceState === "processing") return "speaking_audio";
  if (input.pipelineEnabled && input.videoSegment) {
    if (input.videoSegment.status === "pending") return "rendering_video";
    if (input.videoSegment.status === "ready") return "video_ready";
  }
  return "idle";
}

export function avatarStateFooterHint(state: AvatarState): string | null {
  switch (state) {
    case "listening":
      return "Listening";
    case "speaking_audio":
      return "Speaking · audio live";
    case "rendering_video":
      return "Enhancing avatar · video catching up";
    case "video_ready":
      return "Video synced · muted overlay";
    default:
      return null;
  }
}
