import { cn } from "@/lib/utils";

/**
 * Glass-style shell for dashboard cards (uses `Card` from `@/components/ui/card`).
 */
export function dashboardGlassCardClassName(className?: string) {
  return cn(
    "border-neutral-800/70 bg-neutral-950/35 text-neutral-200 shadow-none backdrop-blur-xl backdrop-saturate-150 ring-1 ring-white/[0.05]",
    "!gap-3 !py-3",
    className,
  );
}
