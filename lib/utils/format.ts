/**
 * Compact numeric formatting for token amounts (usage + limits).
 * `-1` means unlimited in plan config.
 */
export function formatTokens(n: number): string {
  if (n === -1) return "∞";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v : v.toFixed(1)}k`;
  }
  return String(n);
}
