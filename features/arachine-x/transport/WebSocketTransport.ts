"use client";

import type {
  ArachineXEvent,
  ArachineXOutboundAction,
} from "@/features/arachine-x/event-system/eventTypes";
import type {
  TransportAdapter,
  TransportConnectParams,
  TransportConnectionState,
} from "@/features/arachine-x/transport/TransportAdapter";

// Skeleton transport. Replace with real WebSocket protocol + event mapping later.
export class WebSocketTransport implements TransportAdapter {
  private state: TransportConnectionState = "disconnected";
  private handlers = new Set<(event: ArachineXEvent) => void>();
  private socket?: WebSocket;

  async connect(_params: TransportConnectParams) {
    // Placeholder: do nothing (no-op) until websocket protocol is implemented.
    this.state = "connected";
  }

  async disconnect() {
    try {
      this.socket?.close();
    } catch {
      // no-op
    }
    this.state = "disconnected";
    this.socket = undefined;
  }

  send(_action: ArachineXOutboundAction) {
    // Placeholder: outgoing actions handled later.
  }

  subscribe(handler: (event: ArachineXEvent) => void) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  getState() {
    return this.state;
  }
}

