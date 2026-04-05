"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function num(v: string, fallback: number): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const fieldClass =
  "border-neutral-700 bg-neutral-900/70 text-neutral-100 placeholder:text-neutral-600 focus-visible:border-neutral-500 focus-visible:ring-white/20";

export function LandingRoiCalculator() {
  const [sessions, setSessions] = React.useState("2000");
  const [minutes, setMinutes] = React.useState("8");
  const [hourly, setHourly] = React.useState("45");
  const [integrationSpend, setIntegrationSpend] = React.useState("120000");

  const hoursSaved = (num(sessions, 0) * num(minutes, 0)) / 60;
  const laborUsd = hoursSaved * num(hourly, 0);
  const avoided = num(integrationSpend, 0);

  return (
    <Card
      size="sm"
      className="border-white/10 bg-neutral-950/80 text-neutral-100 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] ring-white/10"
    >
      <CardHeader className="border-b border-white/10 pb-4">
        <CardTitle className="text-lg font-semibold text-white">
          ROI sketch
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Directional only — tune inputs to match your ops model. Compare time
          reclaimed vs. a loaded labor rate and a one-time integration /
          renewal placeholder for build-vs-buy sanity checks.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roi-sessions" className="text-neutral-400">
            AI sessions / month
          </Label>
          <Input
            id="roi-sessions"
            type="text"
            inputMode="decimal"
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            className={cn(fieldClass)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roi-minutes" className="text-neutral-400">
            Minutes saved / session
          </Label>
          <Input
            id="roi-minutes"
            type="text"
            inputMode="decimal"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className={cn(fieldClass)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roi-hourly" className="text-neutral-400">
            Blended hourly ($)
          </Label>
          <Input
            id="roi-hourly"
            type="text"
            inputMode="decimal"
            value={hourly}
            onChange={(e) => setHourly(e.target.value)}
            className={cn(fieldClass)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roi-integration" className="text-neutral-400">
            Integration / renewal ($)
          </Label>
          <Input
            id="roi-integration"
            type="text"
            inputMode="decimal"
            value={integrationSpend}
            onChange={(e) => setIntegrationSpend(e.target.value)}
            className={cn(fieldClass)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4 border-t border-white/10 pt-6">
        <dl className="space-y-4 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-neutral-500">Hours reclaimed / mo</dt>
            <dd className="tabular-nums font-medium text-white">
              {hoursSaved.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-neutral-500">Labor value / mo (illustrative)</dt>
            <dd className="tabular-nums font-medium text-white">
              $
              {laborUsd.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="max-w-[min(100%,220px)] text-neutral-500">
              One-time stack / renewal avoided (your figure)
            </dt>
            <dd className="tabular-nums font-medium text-emerald-400/90">
              $
              {avoided.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </dd>
          </div>
        </dl>
      </CardFooter>
    </Card>
  );
}
