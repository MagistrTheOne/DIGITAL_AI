"use client";

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

export function BillingSection() {
  return (
    <Card className="border-neutral-800 bg-neutral-950/50 shadow-none ring-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg text-neutral-100">Billing</CardTitle>
          <CardDescription className="text-neutral-500">
            Plan limits and usage — wire to billing service later.
          </CardDescription>
        </div>
        <Badge
          variant="secondary"
          className="border border-neutral-700 bg-neutral-900 text-neutral-200"
        >
          Pro
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Sessions
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
              12 / 50
            </p>
            <p className="mt-1 text-xs text-neutral-600">Concurrent AI sessions</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Tokens
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
              842K / 2M
            </p>
            <p className="mt-1 text-xs text-neutral-600">Monthly token allocation</p>
          </div>
        </div>
        <Separator className="bg-neutral-800" />
        <p className="text-sm text-neutral-500">
          Usage meters are illustrative placeholders until metering is connected.
        </p>
      </CardContent>
      <CardFooter className="border-t border-neutral-800 pt-6">
        <Button
          type="button"
          className="bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
        >
          Upgrade plan
        </Button>
      </CardFooter>
    </Card>
  );
}
