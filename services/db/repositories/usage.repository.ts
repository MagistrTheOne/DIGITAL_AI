/**
 * Usage metering — persisted counters only; limits come from plan config.
 */
export type UsageSnapshot = {
  sessionsUsed: number;
  tokensUsed: number;
};

export async function getUsageForUser(_userId: string): Promise<UsageSnapshot> {
  return {
    sessionsUsed: 3,
    tokensUsed: 120_000,
  };
}
