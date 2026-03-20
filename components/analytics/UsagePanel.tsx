"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

/** Placeholder quotas — replace via BFF later. */
const SESSIONS_USED = 3;
const SESSIONS_LIMIT = 10;
const TOKENS_USED = 120_000;
const TOKENS_LIMIT = 500_000;

function pct(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function UsagePanel() {
  const sessionPct = pct(SESSIONS_USED, SESSIONS_LIMIT);
  const tokenPct = pct(TOKENS_USED, TOKENS_LIMIT);

  return (
    <Card size="sm" className={cn(cardSurface)}>
      <CardHeader>
        <CardTitle className="text-base text-neutral-100">Usage &amp; limits</CardTitle>
        <CardDescription className="text-neutral-500">
          Workspace consumption against plan caps (placeholder).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-neutral-500">Sessions</span>
            <span className="tabular-nums text-neutral-300">
              {SESSIONS_USED} / {SESSIONS_LIMIT}
            </span>
          </div>
          <Progress
            value={sessionPct}
            className="h-1.5 bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-neutral-400"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-neutral-500">Tokens</span>
            <span className="tabular-nums text-neutral-300">
              120k / 500k
            </span>
          </div>
          <Progress
            value={tokenPct}
            className="h-1.5 bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-neutral-400"
          />
        </div>

        <Separator className="bg-neutral-800" />

        <Alert
          className="border-amber-500/25 bg-amber-500/5 text-amber-100/90 [&_[data-slot=alert-description]]:text-amber-100/70"
          variant="default"
        >
          <AlertTitle className="text-sm">Approaching session cap</AlertTitle>
          <AlertDescription>
            Consider upgrading before automated throttling applies (placeholder copy).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
