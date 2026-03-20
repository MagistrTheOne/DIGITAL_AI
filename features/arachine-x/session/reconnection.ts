export type ReconnectionPolicy = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export const defaultReconnectionPolicy: ReconnectionPolicy = {
  maxRetries: 10,
  baseDelayMs: 250,
  maxDelayMs: 10_000,
};

export function computeReconnectionDelayMs(
  attempt: number,
  policy: ReconnectionPolicy = defaultReconnectionPolicy,
): number | null {
  if (attempt >= policy.maxRetries) return null;

  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 0.25 * exp); // +/- ~12.5%
  return exp + jitter;
}

