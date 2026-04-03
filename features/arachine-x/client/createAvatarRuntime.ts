import type {
  ArachineXOutboundAction,
  ArachineXEvent,
} from "@/features/arachine-x/event-system/eventTypes";
import { createArachineXEventBus } from "@/features/arachine-x/event-system/eventBus";
import type { TransportAdapter } from "@/features/arachine-x/transport/TransportAdapter";
import {
  initialArachineXRuntimeState,
  reduceArachineXRuntimeState,
  type ArachineXRuntimeState,
} from "@/features/arachine-x/session/sessionStateMachine";

export type AvatarSessionBootstrap = {
  sessionId: string;
  websocket: {
    url: string;
    token: string;
  };
  capabilities: string[];
};

export type AvatarRuntime = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendChat(text: string): void;
  setMuted(muted: boolean): void;
  getState(): ArachineXRuntimeState;
  subscribe(cb: (state: ArachineXRuntimeState) => void): () => void;
  /** Raw ARACHNE-X wire events (e.g. append each assistant message to transcript). */
  subscribeEvents(cb: (event: ArachineXEvent) => void): () => void;
};

export function createAvatarRuntime({
  transport,
  bootstrap,
}: {
  transport: TransportAdapter;
  bootstrap: AvatarSessionBootstrap;
}): AvatarRuntime {
  const bus = createArachineXEventBus();
  let state: ArachineXRuntimeState = initialArachineXRuntimeState;

  const stateListeners = new Set<(s: ArachineXRuntimeState) => void>();
  const notify = () => stateListeners.forEach((l) => l(state));

  bus.subscribe((event: ArachineXEvent) => {
    state = reduceArachineXRuntimeState(state, event);
    notify();
  });

  // Wire inbound events from transport -> bus.
  transport.subscribe((event) => bus.publish(event));

  return {
    async connect() {
      await transport.connect({
        url: bootstrap.websocket.url,
        token: bootstrap.websocket.token,
      });
    },
    async disconnect() {
      await transport.disconnect();
      bus.publish({ type: "session.disconnected", at: Date.now(), reason: "disconnect" });
    },
    sendChat(text: string) {
      const action: ArachineXOutboundAction = {
        type: "chat.send",
        id: `c_${Date.now()}`,
        text,
      };
      transport.send(action);
    },
    setMuted(muted: boolean) {
      transport.send({ type: "voice.mute", muted });
    },
    getState() {
      return state;
    },
    subscribe(cb) {
      stateListeners.add(cb);
      // immediate sync
      cb(state);
      return () => stateListeners.delete(cb);
    },
    subscribeEvents(cb) {
      return bus.subscribe(cb);
    },
  };
}

