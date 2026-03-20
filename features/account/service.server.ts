import { getCurrentSession } from "@/lib/auth/session.server";
import { getPlanForUser } from "@/services/db/repositories/billing.repository";
import { getUsageForUser } from "@/services/db/repositories/usage.repository";

import type { AccountDashboardDTO } from "@/features/account/types";

function formatCompactNumber(n: number): string {
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

function formatSessionsLine(used: number, limit: number): string {
  return `${used} / ${limit}`;
}

function formatTokensLine(used: number, limit: number): string {
  return `${formatCompactNumber(used)} / ${formatCompactNumber(limit)}`;
}

export async function getAccountDashboardDTO(): Promise<AccountDashboardDTO | null> {
  const session = await getCurrentSession();
  const user = session?.user;
  if (!user?.id) return null;

  const userId = user.id;

  const [billing, usage] = await Promise.all([
    getPlanForUser(userId),
    getUsageForUser(userId),
  ]);

  const name =
    typeof user.name === "string" && user.name.trim().length > 0
      ? user.name
      : user.email ?? "User";

  return {
    name,
    email: typeof user.email === "string" ? user.email : "",
    image: user.image ?? null,
    plan: billing.planName,
    usage: {
      sessions: formatSessionsLine(usage.sessionsUsed, usage.sessionsLimit),
      tokens: formatTokensLine(usage.tokensUsed, usage.tokensLimit),
    },
  };
}
