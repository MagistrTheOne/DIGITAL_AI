import { redirect } from "next/navigation";

import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";
import { getAnalyticsDashboardDTO } from "@/features/analytics/service.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import { getPlanForUser } from "@/services/db/repositories/billing.repository";

export default async function AnalyticsRoutePage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/sign-in");

  const [data, plan] = await Promise.all([
    getAnalyticsDashboardDTO(),
    getPlanForUser(session.user.id),
  ]);

  if (!data) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-4 p-4 md:p-5">
      <AnalyticsPage
        data={data}
        usageLimits={{
          sessionsLimit: plan.limits.sessions,
          tokensLimit: plan.limits.tokens,
        }}
      />
    </div>
  );
}
