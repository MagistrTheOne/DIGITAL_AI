/**
 * Backlog: real-time micro-motion over the loop MP4 (WebRTC DataChannel or WebSocket).
 * Not wired into runtime yet — contract for phase 2 (ARACHNE-X / NULLXES avatar).
 */

export const MICRO_MOTION_SCHEMA_VERSION = 0 as const;

/** Client- or server-originated tick (monotonic ms, e.g. performance.now() or Date). */
export type MicroMotionTimestampMs = number;

/** Normalized RMS or loudness in [0, 1] from mic analysis. */
export type SpeechEnergyPayload = {
  type: "speech_energy";
  schemaVersion: typeof MICRO_MOTION_SCHEMA_VERSION;
  t: MicroMotionTimestampMs;
  rms: number;
};

/** Discrete gesture cue from LLM tool output or rules engine. */
export type GesturePayload = {
  type: "gesture";
  schemaVersion: typeof MICRO_MOTION_SCHEMA_VERSION;
  t: MicroMotionTimestampMs;
  id: "idle" | "nod" | "tilt" | string;
};

/** Union of v0 events on the motion channel. */
export type MicroMotionEventV0 = SpeechEnergyPayload | GesturePayload;

/** Future hook: map events to CSS/canvas/WebGL on AvatarStage. */
export type MicroMotionRuntimeMode = "off" | "rms_only" | "full";
