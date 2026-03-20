export type SessionPhase = "idle" | "connecting" | "connected" | "error";

export type SessionState = {
  phase: SessionPhase;
  lastError?: string;
  lastAvatarState?: string;
};

export const initialSessionState: SessionState = {
  phase: "idle",
};

