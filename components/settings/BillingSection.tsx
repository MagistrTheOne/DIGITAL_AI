"use client";

import Link from "next/link";

import { useSettingsDto } from "@/components/settings/settings-context";
import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatTokens } from "@/lib/utils/format";

function formatSessionLimit(n: number): string {
  return n === -1 ? "∞" : String(n);
}

export function BillingSection() {
  const { billing } = useSettingsDto();
  const showPolarProUpgrade =
    billing.polarProCheckoutEnabled && billing.planType === "FREE";
  const showPolarEnterpriseUpgrade =
    billing.polarEnterpriseCheckoutEnabled &&
    (billing.planType === "FREE" || billing.planType === "PRO");
  const showPolarPortal =
    billing.polarPortalEnabled &&
    (billing.planType === "PRO" || billing.planType === "ENTERPRISE");

  const sessionsDisplay = `${billing.sessionsUsed} / ${formatSessionLimit(billing.sessionsLimit)}`;
  const tokensDisplay = `${formatTokens(billing.tokensUsed)} / ${billing.tokensLimit === -1 ? "∞" : formatTokens(billing.tokensLimit)}`;

  return (
    <Card size="sm" className={dashboardGlassCardClassName()}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-sm text-neutral-100">Billing</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Plan limits and usage from your subscription and telemetry.
          </CardDescription>
        </div>
        <Badge
          variant="secondary"
          className="border border-neutral-700 bg-neutral-900 text-neutral-200"
        >
          {billing.planLabel}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Chat turns
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
              {sessionsDisplay}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              Rolling 30d · successful turns (plan cap)
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Tokens
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
              {tokensDisplay}
            </p>
            <p className="mt-1 text-xs text-neutral-600">Rolling 30d · vs plan cap</p>
          </div>
        </div>
        <Separator className="bg-neutral-800/80" />
        <p className="text-xs text-neutral-500">
          {billing.polarProCheckoutEnabled ||
          billing.polarEnterpriseCheckoutEnabled ||
          billing.polarPortalEnabled
            ? "Subscriptions are billed through Polar (Merchant of Record). Webhooks keep your plan in sync."
            : "Set POLAR_ACCESS_TOKEN and product ids in the environment to enable checkout and the customer portal."}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-neutral-800/80 pt-3 sm:flex-row sm:flex-wrap">
        {showPolarProUpgrade ? (
          <Button
            asChild
            className="bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
          >
            <a href="/api/billing/polar/checkout?period=monthly">
              Upgrade to Pro
            </a>
          </Button>
        ) : null}
        {showPolarEnterpriseUpgrade ? (
          <Button
            asChild
            variant="outline"
            className="border-neutral-600 bg-transparent text-neutral-200 hover:bg-neutral-900"
          >
            <a href="/api/billing/polar/checkout?plan=enterprise">
              {billing.planType === "PRO"
                ? "Upgrade to Enterprise"
                : "Enterprise checkout"}
            </a>
          </Button>
        ) : null}
        {showPolarPortal ? (
          <Button
            asChild
            variant="outline"
            className="border-neutral-600 bg-transparent text-neutral-200 hover:bg-neutral-900"
          >
            <a href="/api/billing/polar/portal">Manage subscription</a>
          </Button>
        ) : null}
        {!showPolarProUpgrade && billing.planType === "FREE" ? (
          <Button
            asChild
            variant="outline"
            className="border-neutral-600 bg-transparent text-neutral-200 hover:bg-neutral-900"
          >
            <Link href="/premium">View pricing</Link>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
