/**
 * Parse usage lines from AccountDashboardDTO (`"used / limit"`, limits may use k/M/∞).
 */
export type ParsedUsageLine = {
  used: number;
  /** `null` when plan limit is unlimited. */
  limit: number | null;
};

function parseCompactNumber(raw: string): number | "unlimited" | null {
  const s = raw.trim();
  if (s === "∞") return "unlimited";

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  const k = /^([\d.]+)\s*k$/i.exec(s);
  if (k) {
    const n = parseFloat(k[1]!);
    return Number.isFinite(n) ? Math.round(n * 1000) : null;
  }

  const m = /^([\d.]+)\s*m$/i.exec(s);
  if (m) {
    const n = parseFloat(m[1]!);
    return Number.isFinite(n) ? Math.round(n * 1_000_000) : null;
  }

  const plain = Number(s);
  return Number.isFinite(plain) ? plain : null;
}

export function parseUsageFraction(line: string): ParsedUsageLine | null {
  const idx = line.indexOf("/");
  if (idx === -1) return null;
  const left = line.slice(0, idx).trim();
  const right = line.slice(idx + 1).trim();
  if (!left || !right) return null;

  const used = parseCompactNumber(left);
  const lim = parseCompactNumber(right);
  if (used === null || used === "unlimited") return null;
  if (lim === "unlimited") {
    return { used, limit: null };
  }
  if (lim === null) return null;
  return { used, limit: lim };
}

/** Percent for Progress; `undefined` when unlimited or non-positive limit. */
export function toProgressPercent(
  used: number,
  limit: number | null,
): number | undefined {
  if (limit === null || limit <= 0) return undefined;
  return Math.min(100, Math.round((used / limit) * 100));
}
