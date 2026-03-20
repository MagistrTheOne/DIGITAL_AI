import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

/** Placeholder economics — replace via BFF later. */
const AI_TASKS = 12_400;
const HUMAN_FTE = 3.2;
const COST_SAVED = "$18.2k";

export function BusinessImpactCard() {
  return (
    <Card size="sm" className={cn(cardSurface)}>
      <CardHeader>
        <CardTitle className="text-base text-neutral-100">AI vs human impact</CardTitle>
        <CardDescription className="text-neutral-500">
          Rough equivalence vs staffing (placeholder model).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-neutral-500">AI-handled tasks</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
              {AI_TASKS.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-600">This month</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Equivalent humans (FTE)</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
              ~{HUMAN_FTE}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-600">Blended roles</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Cost saved (est.)</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-400/90">
              {COST_SAVED}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-600">Vs. baseline</div>
          </div>
        </div>
        <Separator className="bg-neutral-800" />
        <p className="text-sm leading-relaxed text-neutral-400">
          AI replaced roughly <span className="font-medium text-neutral-200">{HUMAN_FTE} full-time
          equivalents</span> this month — reinvest capacity into higher-leverage work (placeholder
          narrative).
        </p>
      </CardContent>
    </Card>
  );
}
