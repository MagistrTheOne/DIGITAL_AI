"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { STEP_LABELS } from "@/components/create-employee/constants";

export function Stepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const pct = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <Badge
            key={label}
            variant={i === currentStep ? "secondary" : "outline"}
            className={cn(
              "border-neutral-700 text-[11px] font-normal uppercase tracking-wide",
              i === currentStep && "border-neutral-500 bg-neutral-800 text-neutral-100",
              i < currentStep && "border-emerald-500/40 text-emerald-400/90",
            )}
          >
            {i + 1}. {label}
          </Badge>
        ))}
      </div>
      <Progress
        value={pct}
        className="h-1 bg-neutral-800 **:data-[slot=progress-indicator]:bg-neutral-400"
      />
    </div>
  );
}
