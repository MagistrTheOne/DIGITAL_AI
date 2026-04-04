import type {
  ArachineXChatEvent,
  ArachineXEvent,
  ArachineXSessionEvent,
} from "@/features/arachine-x/event-system/eventTypes";

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

export type ArachineXRuntimePhase =
  | "idle"
  | "connecting"
  | "connected"
  | "streaming"
  | "error";

export type ArachineXAvatarState = "idle" | "speaking" | "thinking" | "listening";

export type ArachineXRuntimeState = {
  phase: ArachineXRuntimePhase;
  avatarState: ArachineXAvatarState;
  lastChatMessage?: {
    id: string;
    from: "user" | "assistant";
    text: string;
  };
  lastError?: string;
};

export const initialArachineXRuntimeState: ArachineXRuntimeState = {
  phase: "idle",
  avatarState: "idle",
};

export function reduceArachineXRuntimeState(
  state: ArachineXRuntimeState,
  event: ArachineXEvent,
): ArachineXRuntimeState {
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
  event: ArachineXEvent,
): event is ArachineXSessionEvent {
  return (
    event.type === "session.connecting" ||
    event.type === "session.connected" ||
    event.type === "session.disconnected" ||
    event.type === "session.error"
  );
}

export function isChatEvent(
  event: ArachineXEvent,
): event is ArachineXChatEvent {
  return event.type === "chat.message.received";
}

