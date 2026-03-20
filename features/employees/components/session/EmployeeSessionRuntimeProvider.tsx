"use client";

import * as React from "react";

import type { EmployeeSessionBootstrapDTO } from "@/features/employees/types";
import { initialSessionState, type SessionState } from "@/features/employees/components/session/sessionState";

type SessionContextValue = {
  state: SessionState;
  connect: () => void;
  disconnect: () => void;
  sendChat: (message: string) => void;
};

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function useEmployeeSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useEmployeeSession must be used within SessionProvider");
  return ctx;
}

export function EmployeeSessionRuntimeProvider({
  bootstrap,
  children,
}: {
  bootstrap: EmployeeSessionBootstrapDTO;
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<SessionState>(initialSessionState);
  const bootstrapRef = React.useRef(bootstrap);
  bootstrapRef.current = bootstrap;

  const connect = React.useCallback(() => {
    setState((s) => ({ ...s, phase: "connecting", lastError: undefined }));

    // Placeholder lifecycle: real ARACHNE-X connection is wired later.
    window.setTimeout(() => {
      setState((s) => ({ ...s, phase: "connected" }));
    }, 250);
  }, []);

  const disconnect = React.useCallback(() => {
    setState((s) => ({ ...s, phase: "idle" }));
  }, []);

  const sendChat = React.useCallback((_message: string) => {
    // Placeholder: chat messages will be routed to ARACHNE-X transport later.
  }, []);

  React.useEffect(() => {
    // Start connection automatically on mount.
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      state,
      connect,
      disconnect,
      sendChat,
    }),
    [connect, disconnect, sendChat, state],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

