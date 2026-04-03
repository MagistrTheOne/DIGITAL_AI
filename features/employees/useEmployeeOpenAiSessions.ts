"use client";

import * as React from "react";

import type { InteractionMessage } from "@/components/employee-interaction/types";
import {
  defaultSessionTitleFromMessage,
  loadEmployeeOpenAiSessions,
  saveEmployeeOpenAiSessions,
  type EmployeeOpenAiChatSession,
} from "@/features/employees/employeeOpenAiSessions.client";

function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function useEmployeeOpenAiSessions(
  employeeId: string,
  enabled: boolean,
) {
  const [sessions, setSessions] = React.useState<EmployeeOpenAiChatSession[]>(
    [],
  );
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(
    null,
  );
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setSessions([]);
      setActiveSessionId(null);
      setHydrated(false);
      return;
    }

    const loaded = loadEmployeeOpenAiSessions(employeeId);
    if (loaded?.sessions?.length) {
      setSessions(loaded.sessions);
      const active =
        loaded.sessions.some((s) => s.id === loaded.activeSessionId)
          ? loaded.activeSessionId
          : loaded.sessions[0].id;
      setActiveSessionId(active);
    } else {
      const id = newSessionId();
      setSessions([
        {
          id,
          title: "New chat",
          updatedAt: Date.now(),
          messages: [],
        },
      ]);
      setActiveSessionId(id);
    }
    setHydrated(true);
  }, [employeeId, enabled]);

  React.useEffect(() => {
    if (!enabled || !hydrated || !activeSessionId) return;
    saveEmployeeOpenAiSessions(employeeId, activeSessionId, sessions);
  }, [employeeId, activeSessionId, sessions, hydrated, enabled]);

  const messages = React.useMemo(() => {
    if (!enabled || !activeSessionId) return [];
    return sessions.find((s) => s.id === activeSessionId)?.messages ?? [];
  }, [sessions, activeSessionId, enabled]);

  const setMessages = React.useCallback(
    (updater: React.SetStateAction<InteractionMessage[]>) => {
      if (!enabled || !activeSessionId) return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const next =
            typeof updater === "function"
              ? (updater as (m: InteractionMessage[]) => InteractionMessage[])(
                  s.messages,
                )
              : updater;
          return { ...s, messages: next, updatedAt: Date.now() };
        }),
      );
    },
    [activeSessionId, enabled],
  );

  const selectSession = React.useCallback(
    (id: string) => {
      if (!enabled) return;
      setActiveSessionId(id);
    },
    [enabled],
  );

  const newSession = React.useCallback(() => {
    if (!enabled) return;
    const id = newSessionId();
    setSessions((prev) => [
      {
        id,
        title: "New chat",
        updatedAt: Date.now(),
        messages: [],
      },
      ...prev,
    ]);
    setActiveSessionId(id);
  }, [enabled]);

  const renameSession = React.useCallback(
    (id: string, title: string) => {
      if (!enabled) return;
      const t = title.trim() || "New chat";
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, title: t, updatedAt: Date.now() } : s,
        ),
      );
    },
    [enabled],
  );

  const deleteSession = React.useCallback(
    (id: string) => {
      if (!enabled) return;
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          const nid = newSessionId();
          setActiveSessionId(nid);
          return [
            {
              id: nid,
              title: "New chat",
              updatedAt: Date.now(),
              messages: [],
            },
          ];
        }
        setActiveSessionId((cur) => (cur === id ? next[0]!.id : cur));
        return next;
      });
    },
    [enabled],
  );

  const maybeAutonameFromUserText = React.useCallback(
    (userText: string) => {
      if (!enabled || !activeSessionId || !userText.trim()) return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          if (s.title !== "New chat") return s;
          return {
            ...s,
            title: defaultSessionTitleFromMessage(userText),
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [activeSessionId, enabled],
  );

  return {
    hydrated: enabled ? hydrated : true,
    sessions: enabled ? sessions : [],
    activeSessionId: enabled ? activeSessionId : null,
    messages,
    setMessages,
    selectSession,
    newSession,
    renameSession,
    deleteSession,
    maybeAutonameFromUserText,
  };
}
