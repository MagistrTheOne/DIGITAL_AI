/** Normalize Better Auth / fetch error shapes for UI messages. */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    const msg = e.message;
    if (typeof msg === "string" && msg.trim()) return msg;
    const status = e.status;
    if (typeof status === "number" && status >= 400) return fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
