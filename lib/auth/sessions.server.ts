import { formatDistanceToNow } from "date-fns";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

import { auth } from "@/lib/auth";
import type { SettingsSecuritySessionDTO } from "@/features/settings/types";

function deviceLabelFromUserAgent(ua: string | null | undefined): string {
  const s = ua?.trim();
  if (!s) return "Unknown browser";
  const p = new UAParser(s).getResult();
  const browser = p.browser.name || "Browser";
  const os = p.os.name;
  if (os) return `${browser} · ${os}`;
  return browser;
}

type ListedSession = {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Active auth sessions for the current cookie, safe for the client (no tokens).
 */
export async function getSecuritySessionsDto(): Promise<
  SettingsSecuritySessionDTO[]
> {
  const h = await headers();
  const current = await auth.api.getSession({ headers: h });
  if (!current?.session) return [];

  const currentId = current.session.id;
  let listed: ListedSession[] = [];
  try {
    const raw = await auth.api.listSessions({ headers: h });
    listed = Array.isArray(raw) ? (raw as ListedSession[]) : [];
  } catch {
    return [];
  }

  const rows = listed.map((s) => {
    const isCurrent = s.id === currentId;
    const ref = s.updatedAt ?? s.createdAt;
    const d = ref instanceof Date ? ref : new Date(ref);
    const activityLabel = isCurrent
      ? "Active now"
      : formatDistanceToNow(d, { addSuffix: true });
    return {
      id: s.id,
      deviceLabel: deviceLabelFromUserAgent(s.userAgent),
      ipLabel: s.ipAddress?.trim() ? s.ipAddress : "—",
      activityLabel,
      isCurrent,
    };
  });

  rows.sort((a, b) => {
    if (a.isCurrent === b.isCurrent) return 0;
    return a.isCurrent ? -1 : 1;
  });
  return rows;
}
