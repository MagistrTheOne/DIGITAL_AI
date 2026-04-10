"use client";

import type {
  ArachneXEvent,
  ArachneXOutboundAction,
} from "@/features/arachne-x/event-system/eventTypes";
import type {
  TransportAdapter,
  TransportConnectParams,
  TransportConnectionState,
} from "@/features/arachne-x/transport/TransportAdapter";

function resolveWebSocketHref(url: string): string {
  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    return url;
  }
  if (typeof window !== "undefined") {
    return new URL(url, window.location.origin).href;
  }
  return url;
}

/** Append token query param when the mint URL does not already include one. */
export function buildWebSocketUrlWithToken(wsUrl: string, token: string): string {
  const absolute = resolveWebSocketHref(wsUrl);
  const u = new URL(absolute);
  if (!u.searchParams.get("token")) {
    u.searchParams.set("token", token);
  }
  return u.toString();
}

function parseWireEvent(data: string): ArachneXEvent | null {
  try {
    const o = JSON.parse(data) as unknown;
    if (!o || typeof o !== "object") return null;
    const rec = o as Record<string, unknown>;
    if (typeof rec.type !== "string" || typeof rec.at !== "number") return null;
    return o as ArachneXEvent;
  } catch {
    return null;
  }
}

export class WebSocketTransport implements TransportAdapter {
  private state: TransportConnectionState = "disconnected";
  private handlers = new Set<(event: ArachneXEvent) => void>();
  private socket?: WebSocket;

  async connect(params: TransportConnectParams) {
    const { url, token } = params;
    if (!url?.trim() || !token?.trim()) {
      this.state = "error";
      this.emit({
        type: "session.error",
        at: Date.now(),
        message: "missing_ws_url_or_token",
      });
      return;
    }

    this.state = "connecting";

    const wsUrl = buildWebSocketUrlWithToken(url, token);

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(wsUrl);
      this.socket = ws;

      const done = (err?: Error) => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };

      ws.onopen = () => {
        this.state = "connected";
        done();
      };

      ws.onerror = () => {
        this.state = "error";
        if (!settled) {
          settled = true;
          reject(new Error("WebSocket connection failed"));
        }
        this.emit({
          type: "session.error",
          at: Date.now(),
          message: "websocket_error",
        });
      };

      ws.onclose = (ev) => {
        const was = this.state;
        this.state = "disconnected";
        this.socket = undefined;

        if (ev.code === 4401 || ev.code === 1008) {
          this.emit({
            type: "session.error",
            at: Date.now(),
            message: "auth_failed",
          });
        }

        if (was === "connected" || was === "connecting") {
          this.emit({
            type: "session.disconnected",
            at: Date.now(),
            reason: `close_${ev.code}`,
          });
        }

        if (!settled) {
          settled = true;
          reject(new Error(`WebSocket closed (${ev.code})`));
        }
      };

      ws.onmessage = (evt) => {
        if (typeof evt.data !== "string") return;
        const event = parseWireEvent(evt.data);
        if (event) this.emit(event);
      };
    });
  }

  async disconnect() {
    try {
      this.socket?.close(1000, "client_disconnect");
    } catch {
      // no-op
    }
    this.socket = undefined;
    this.state = "disconnected";
  }

  send(action: ArachneXOutboundAction) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    try {
      this.socket.send(JSON.stringify(action));
    } catch {
      // no-op
    }
  }

  subscribe(handler: (event: ArachneXEvent) => void) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  getState() {
    return this.state;
  }

  private emit(event: ArachneXEvent) {
    this.handlers.forEach((h) => h(event));
  }
}
