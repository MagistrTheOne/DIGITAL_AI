"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Props = {
  status: "loading" | "live" | "error" | "stopped";
  micMuted: boolean;
  onMicMutedChange: (muted: boolean) => void;
  onStopSession: () => void;
  onStartSession: () => void;
  onRetry?: () => void;
};

/** Mic on/off + Stop / Start session for Anam preview. */
export function AnamSessionToolbar({
  status,
  micMuted,
  onMicMutedChange,
  onStopSession,
  onStartSession,
  onRetry,
}: Props) {
  const micOn = !micMuted;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {status === "live" && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-neutral-200">
              Microphone
            </span>
            <span className="text-[11px] text-neutral-500">
              {micOn ? "Sending audio to avatar" : "Muted — avatar won’t hear you"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">{micOn ? "On" : "Off"}</span>
            <Switch
              checked={micOn}
              onCheckedChange={(on) => onMicMutedChange(!on)}
              aria-label="Toggle microphone to avatar"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {status === "live" && (
          <Button
            type="button"
            variant="destructive"
            className="min-w-[140px] rounded-full"
            onClick={onStopSession}
          >
            Stop session
          </Button>
        )}

        {status === "stopped" && (
          <Button
            type="button"
            className="min-w-[160px] rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={onStartSession}
          >
            Start session
          </Button>
        )}

        {status === "error" && onRetry && (
          <Button
            type="button"
            variant="outline"
            className="min-w-[140px] rounded-full border-neutral-600"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
