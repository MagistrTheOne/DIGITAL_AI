"use client";

import * as React from "react";

import { WebSocketTransport } from "@/features/arachine-x/transport/WebSocketTransport";
import type {
  AvatarRuntime,
  AvatarSessionBootstrap,
} from "@/features/arachine-x/client/createAvatarRuntime";
import { createAvatarRuntime } from "@/features/arachine-x/client/createAvatarRuntime";

export function useAvatarRuntime(bootstrap: AvatarSessionBootstrap) {
  const runtimeRef = React.useRef<AvatarRuntime | null>(null);
  const [, forceRender] = React.useState(0);

  if (!runtimeRef.current) {
    runtimeRef.current = createAvatarRuntime({
      transport: new WebSocketTransport(),
      bootstrap,
    });
  }

  React.useEffect(() => {
    const unsub = runtimeRef.current!.subscribe(() => {
      // Simple state refresh. Replace with a more ergonomic store later.
      forceRender((x) => x + 1);
    });
    return unsub;
  }, []);

  const connect = React.useCallback(async () => runtimeRef.current?.connect(), []);
  const disconnect = React.useCallback(async () => runtimeRef.current?.disconnect(), []);
  const sendChat = React.useCallback((text: string) => runtimeRef.current?.sendChat(text), []);
  const setMuted = React.useCallback((muted: boolean) => runtimeRef.current?.setMuted(muted), []);

  const subscribeEvents = React.useCallback(
    (cb: Parameters<AvatarRuntime["subscribeEvents"]>[0]) => {
      return runtimeRef.current?.subscribeEvents(cb) ?? (() => {});
    },
    [],
  );

  return {
    state: runtimeRef.current!.getState(),
    connect,
    disconnect,
    sendChat,
    setMuted,
    subscribeEvents,
  };
}

