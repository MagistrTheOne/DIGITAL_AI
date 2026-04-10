import type {
  ArachneXChatEvent,
  ArachneXEvent,
  ArachneXSessionEvent,
} from "@/features/arachne-x/event-system/eventTypes";

const SESSION_ERROR_MESSAGES: Record<string, string> = {
  infer_queue_full:
    "Avatar queue is full — try again in a moment or reduce concurrent sessions.",
  avatar_inference_failed: "Avatar video generation failed. You can keep chatting.",
  avatar_inference_empty:
    "Avatar produced no video output. You can keep chatting.",
};

export function formatSessionErrorMessage(event: {
  message: string;
  code?: string;
}): string {
  const code = event.code?.trim();
  if (code && SESSION_ERROR_MESSAGES[code]) {
    return SESSION_ERROR_MESSAGES[code];
  }
  return event.message;
}

export type ArachneXRuntimePhase =
  | "idle"
  | "connecting"
  | "connected"
  | "streaming"
  | "error";

export type ArachneXAvatarState = "idle" | "speaking" | "thinking" | "listening";

export type ArachneXRuntimeState = {
  phase: ArachneXRuntimePhase;
  avatarState: ArachneXAvatarState;
  lastChatMessage?: {
    id: string;
    from: "user" | "assistant";
    text: string;
  };
  lastError?: string;
};

export const initialArachneXRuntimeState: ArachneXRuntimeState = {
  phase: "idle",
  avatarState: "idle",
};

export function reduceArachneXRuntimeState(
  state: ArachneXRuntimeState,
  event: ArachneXEvent,
): ArachneXRuntimeState {
  switch (event.type) {
    case "session.connecting":
      return { ...state, phase: "connecting", lastError: undefined };
    case "session.connected":
      return { ...state, phase: "connected" };
    case "session.disconnected":
      return { ...state, phase: "idle" };
    case "session.error":
      return {
        ...state,
        phase: "error",
        lastError: formatSessionErrorMessage(event),
      };
    case "avatar.state.changed":
      return { ...state, avatarState: event.state };
    case "chat.message.received":
      return {
        ...state,
        lastChatMessage: {
          id: event.message.id,
          from: event.message.from,
          text: event.message.text,
        },
      };
    default:
      return state;
  }
}

export function isSessionEvent(
  event: ArachneXEvent,
): event is ArachneXSessionEvent {
  return (
    event.type === "session.connecting" ||
    event.type === "session.connected" ||
    event.type === "session.disconnected" ||
    event.type === "session.error"
  );
}

export function isChatEvent(
  event: ArachneXEvent,
): event is ArachneXChatEvent {
  return event.type === "chat.message.received";
}

