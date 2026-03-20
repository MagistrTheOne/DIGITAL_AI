/**
 * Usage persistence — stub until real metering exists.
 */
export type UsageSnapshot = {
  sessionsUsed: number;
  sessionsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
};

export async function getUsageForUser(_userId: string): Promise<UsageSnapshot> {
  return {
    sessionsUsed: 3,
    sessionsLimit: 10,
    tokensUsed: 120_000,
    tokensLimit: 500_000,
  };
}
