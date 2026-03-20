import type {
  ArachineXChatEvent,
  ArachineXEvent,
  ArachineXSessionEvent,
} from "@/features/arachine-x/event-system/eventTypes";

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
      return { ...state, phase: "error", lastError: event.message };
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

