"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { VoiceUiState } from "@/components/employee-interaction/types";

function presenceFromVoice(voice: VoiceUiState): "active" | "idle" {
  if (voice === "processing") return "idle";
  return "active";
}

export function EmployeeHeader({
  displayName,
  roleLabel,
  voiceState,
}: {
  displayName: string;
  roleLabel?: string;
  voiceState: VoiceUiState;
}) {
  const presence = presenceFromVoice(voiceState);

  return (
    <header className="flex shrink-0 flex-col gap-4 border-b border-neutral-800 pb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          asChild
        >
          <Link href="/ai-digital">← AI Digital</Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-100">
            {displayName}
          </h1>
          {roleLabel ? (
            <p className="text-sm text-neutral-500">{roleLabel}</p>
          ) : null}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 border-neutral-700 font-medium",
            presence === "active"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200/90"
              : "border-amber-500/35 bg-amber-500/10 text-amber-200/80",
          )}
        >
          {presence === "active" ? "Active" : "Idle"}
        </Badge>
      </div>
    </header>
  );
}
