export type ArachneXSessionEvent =
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
      /**
       * Stable machine code from ARACHNE-X / worker (avatar async infer, queue, etc.).
       * UI may map this to friendlier copy; see documents/ARACHNE_ASYNC_INFERENCE.md.
       */
      code?: string;
    };

export type ArachneXAvatarEvent =
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
      /** Real stream: base64 JPEG payload (see ARACHNE_X_FRONTEND_CONTRACT §5–6). */
      encoding?: "jpeg_base64";
      data?: string;
    };

export type ArachneXChatEvent = {
  type: "chat.message.received";
  at: number;
  message: {
    id: string;
    from: "user" | "assistant";
    text: string;
  };
};

/**
 * Optional: ARACHNE-X may forward SaaS avatar job metadata so the UI can skip polling.
 * Safe to ignore if the gateway does not emit this yet.
 */
export type ArachneXAvatarRenderMetaEvent = {
  type: "avatar.render.meta";
  at: number;
  jobId: string;
  sequence: number;
  videoTier: "realtime" | "enhanced";
};

export type ArachneXEvent =
  | ArachneXSessionEvent
  | ArachneXAvatarEvent
  | ArachneXChatEvent
  | ArachneXAvatarRenderMetaEvent;

export type ArachneXOutboundAction =
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

