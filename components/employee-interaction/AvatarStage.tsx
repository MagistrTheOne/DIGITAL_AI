"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0]![0] ?? ""}${p[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

/**
 * Placeholder for future video / streaming avatar.
 * Large rounded stage, centered character presence.
 */
export function AvatarStage({ displayName }: { displayName: string }) {
  const letter = initials(displayName);

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        aria-label="Avatar stream placeholder"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(120,120,120,0.12),transparent_55%)]" />
        <div className="flex size-full items-center justify-center">
          <Avatar className="size-32 border-2 border-neutral-700/80 shadow-lg">
            <AvatarFallback className="bg-neutral-800 text-3xl font-medium text-neutral-200">
              {letter}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute inset-x-0 bottom-0 border-t border-neutral-800/80 bg-neutral-950/85 px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-neutral-500 backdrop-blur-sm">
          Live avatar · video later
        </div>
      </div>
    </div>
  );
}
