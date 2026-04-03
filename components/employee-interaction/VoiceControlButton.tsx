"use client";

import { Loader2, Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { VoiceUiState } from "@/components/employee-interaction/types";

const DEFAULT_LABELS: Record<VoiceUiState, string> = {
  idle: "Tap to speak",
  recording: "Listening… tap to stop",
  processing: "Processing…",
};

export function VoiceControlButton({
  state,
  onPress,
  labels,
}: {
  state: VoiceUiState;
  onPress: () => void;
  /** Override captions (e.g. push-to-talk vs server VAD). */
  labels?: Partial<Record<VoiceUiState, string>>;
}) {
  const merged = { ...DEFAULT_LABELS, ...labels };
  const busy = state === "processing";

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={busy}
        onClick={onPress}
        aria-pressed={state === "recording"}
        aria-label={merged[state]}
        className={cn(
          "size-20 rounded-full border-2 shadow-lg transition-all duration-300",
          "border-neutral-600 bg-neutral-900 text-neutral-100 hover:bg-neutral-800",
          state === "recording" &&
            "border-red-500/60 bg-red-950/40 text-red-100 ring-4 ring-red-500/20 animate-pulse",
          state === "processing" && "opacity-80",
        )}
      >
        {state === "processing" ? (
          <Loader2 className="size-9 animate-spin" aria-hidden />
        ) : state === "recording" ? (
          <Square className="size-8 fill-current" aria-hidden />
        ) : (
          <Mic className="size-9" aria-hidden />
        )}
      </Button>
      <p className="max-w-56 text-center text-xs text-neutral-500">{merged[state]}</p>
    </div>
  );
}
