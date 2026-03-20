import { getCurrentSession } from "@/lib/auth/session.server";
import { formatTokens } from "@/lib/utils/format";
import { getPlanForUser } from "@/services/db/repositories/billing.repository";
import { getUsageForUser } from "@/services/db/repositories/usage.repository";

import type { AccountDashboardDTO } from "@/features/account/types";

function formatSessionLimit(n: number): string {
  if (n === -1) return "∞";
  return String(n);
}

function formatSessionsLine(used: number, limit: number): string {
  return `${used} / ${formatSessionLimit(limit)}`;
}

function formatTokensLine(used: number, limit: number): string {
  return `${formatTokens(used)} / ${formatTokens(limit)}`;
}

export async function getAccountDashboardDTO(): Promise<AccountDashboardDTO | null> {
  const session = await getCurrentSession();
  const user = session?.user;
  if (!user?.id) return null;

  const userId = user.id;

  const [planConfig, usage] = await Promise.all([
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
    plan: planConfig.label,
    usage: {
      sessions: formatSessionsLine(
        usage.sessionsUsed,
        planConfig.limits.sessions,
      ),
      tokens: formatTokensLine(usage.tokensUsed, planConfig.limits.tokens),
    },
  };
}
