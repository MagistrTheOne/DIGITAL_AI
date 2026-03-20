export type ArachineXSessionEvent =
  | {
      type: "session.connecting";
      at: number;
    }
  | {
      type: "session.connected";
      at: number;
    }
  | {
      type: "session.disconnected";
      at: number;
      reason?: string;
    }
  | {
      type: "session.error";
      at: number;
      message: string;
    };

export type ArachineXAvatarEvent =
  | {
      type: "avatar.state.changed";
      at: number;
      state: "idle" | "speaking" | "thinking" | "listening";
    }
  | {
      type: "avatar.stream.chunk";
      at: number;
      kind: "video" | "audio";
      seq: number;
    };

export type ArachineXChatEvent = {
  type: "chat.message.received";
  at: number;
  message: {
    id: string;
    from: "user" | "assistant";
    text: string;
  };
};

export type ArachineXEvent =
  | ArachineXSessionEvent
  | ArachineXAvatarEvent
  | ArachineXChatEvent;

export type ArachineXOutboundAction =
  | {
      type: "chat.send";
      id: string;
      text: string;
    }
  | {
      type: "voice.mute";
      muted: boolean;
    }
  | {
      type: "session.disconnect";
    };

