import type { InteractionMessage } from "@/components/employee-interaction/types";

const STORAGE_PREFIX = "dai_saas:empChat:v2:";

export type EmployeeOpenAiChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: InteractionMessage[];
};

type Persisted = {
  v: 2;
  activeSessionId: string;
  sessions: EmployeeOpenAiChatSession[];
};

function storageKey(employeeId: string) {
  return `${STORAGE_PREFIX}${employeeId}`;
}

export function loadEmployeeOpenAiSessions(employeeId: string): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(employeeId));
    if (!raw) return null;
    const data = JSON.parse(raw) as Persisted;
    if (data?.v !== 2 || !Array.isArray(data.sessions)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveEmployeeOpenAiSessions(
  employeeId: string,
  activeSessionId: string,
  sessions: EmployeeOpenAiChatSession[],
) {
  if (typeof window === "undefined") return;
  try {
    const payload: Persisted = { v: 2, activeSessionId, sessions };
    localStorage.setItem(storageKey(employeeId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function defaultSessionTitleFromMessage(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "New chat";
  return t.length > 48 ? `${t.slice(0, 45)}…` : t;
}
