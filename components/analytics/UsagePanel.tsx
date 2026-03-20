"use client";

import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

function pressureTone(p: number): "neutral" | "warn" | "critical" {
  if (p >= 67) return "critical";
  if (p >= 34) return "warn";
  return "neutral";
}

function progressBarClass(p: number) {
  const t = pressureTone(p);
  return cn(
    "h-2 bg-neutral-800",
    t === "neutral" && "[&_[data-slot=progress-indicator]]:bg-neutral-400",
    t === "warn" && "[&_[data-slot=progress-indicator]]:bg-amber-400",
    t === "critical" && "[&_[data-slot=progress-indicator]]:bg-red-500",
  );
}

export function UsagePanel() {
  const sessionPct = pct(SESSIONS_USED, SESSIONS_LIMIT);
  const tokenPct = pct(TOKENS_USED, TOKENS_LIMIT);
  const maxPressure = Math.max(sessionPct, tokenPct);
  const pressureLabel =
    pressureTone(maxPressure) === "critical"
      ? "Critical pressure"
      : pressureTone(maxPressure) === "warn"
        ? "Elevated usage"
        : "Within range";

  return (
    <Card size="sm" className={cn(cardSurface)}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base text-neutral-100">Usage pressure</CardTitle>
            <CardDescription className="text-neutral-500">
              Consumption vs plan caps — color reflects runway (placeholder).
            </CardDescription>
          </div>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              pressureTone(maxPressure) === "critical" &&
                "border-red-500/40 bg-red-500/10 text-red-300",
              pressureTone(maxPressure) === "warn" &&
                "border-amber-500/40 bg-amber-500/10 text-amber-200",
              pressureTone(maxPressure) === "neutral" &&
                "border-neutral-700 bg-neutral-900 text-neutral-400",
            )}
          >
            {pressureLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-neutral-500">Sessions</span>
            <span className="tabular-nums text-neutral-300">
              {SESSIONS_USED} / {SESSIONS_LIMIT}
            </span>
          </div>
          <Progress value={sessionPct} className={progressBarClass(sessionPct)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-neutral-500">Tokens</span>
            <span className="tabular-nums text-neutral-300">120k / 500k</span>
          </div>
          <Progress value={tokenPct} className={progressBarClass(tokenPct)} />
        </div>

        <p className="text-xs text-neutral-500">
          <span className="text-neutral-400">Projection:</span> ~3 days until session limit
          at current burn (placeholder model).
        </p>

        <Separator className="bg-neutral-800" />

        <Alert
          className="border-amber-500/25 bg-amber-500/5 text-amber-100/90 [&_[data-slot=alert-description]]:text-amber-100/70"
          variant="default"
        >
          <AlertTitle className="text-sm">Upgrade to unlock headroom</AlertTitle>
          <AlertDescription>
            Approaching caps on Free — throttle risk increases as you scale (placeholder copy).
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 border-t border-neutral-800 pt-4 sm:flex-row sm:justify-end">
        <Button
          asChild
          variant="secondary"
          className="border border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
        >
          <Link href="/premium">Upgrade to Pro — unlock 10× capacity</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
