/**
 * Estimates incremental "cost saved" cents per successful chat turn for analytics.
 * Tune via env; defaults are conservative placeholders, not financial advice.
 */

export function computeCostSavedCentsForTurn(input: {
  success: boolean;
  tokensDelta: number;
}): number {
  if (!input.success) return 0;

  const fixedRaw = process.env.ANALYTICS_COST_SAVED_FIXED_CENTS_PER_SUCCESS_TURN?.trim();
  const fixedParsed =
    fixedRaw !== undefined && fixedRaw !== ""
      ? Number.parseInt(fixedRaw, 10)
      : 25;
  const fixedCents =
    Number.isFinite(fixedParsed) && fixedParsed >= 0 ? fixedParsed : 25;

  const usdRaw =
    process.env.ANALYTICS_COST_SAVED_USD_PER_1K_TOKENS?.trim() ?? "0.002";
  const usdPer1k = Number.parseFloat(usdRaw);
  const tokenCents =
    Number.isFinite(usdPer1k) && usdPer1k > 0
      ? Math.round((Math.max(0, input.tokensDelta) / 1000) * usdPer1k * 100)
      : 0;

  return fixedCents + tokenCents;
}
