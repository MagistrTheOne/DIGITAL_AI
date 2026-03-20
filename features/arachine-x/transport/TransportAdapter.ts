import type {
  ArachineXEvent,
  ArachineXOutboundAction,
} from "@/features/arachine-x/event-system/eventTypes";

export type TransportConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type TransportConnectParams = {
  url: string;
  token: string;
};

export interface TransportAdapter {
  connect(params: TransportConnectParams): Promise<void>;
  disconnect(): Promise<void>;
  send(action: ArachineXOutboundAction): void;

  // Subscribes to inbound events; returns an unsubscribe callback.
  subscribe(handler: (event: ArachineXEvent) => void): () => void;

  getState(): TransportConnectionState;
}

