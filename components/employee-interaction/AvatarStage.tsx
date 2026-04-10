"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import type { ArachneXEvent } from "@/features/arachne-x/event-system/eventTypes";
import { useAvatarArachneVideoStream } from "@/features/arachne-x/client/useAvatarArachneVideoStream";
import {
  avatarStateFooterHint,
  type AvatarState,
} from "@/features/employees/avatar-digital-human.types";
import type { AvatarSyncResponse } from "@/features/employees/avatar-sync.client";
import type { AvatarSegmentOverlay } from "@/features/employees/useAvatarRenderPipeline";
import type { EmployeeVideoPreview } from "@/features/employees/types";

import { SyncAvatarPlaybackLayer } from "@/components/employee-interaction/SyncAvatarPlaybackLayer";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0]![0] ?? ""}${p[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

/**
 * Static preview (`videoPreviewUrl`), ARACHNE WebSocket JPEG stream (`avatar.stream.chunk`),
 * or stub spinner when only seq/kind metadata arrives.
 */
export function AvatarStage({
  displayName,
  videoPreview,
  arachneStreamEnabled = false,
  subscribeArachne,
  segmentOverlay,
  digitalHumanState,
  syncPlayback,
  onSyncPlaybackEnd,
  /** When false, loop clip stays muted; hover does not unmute (parent can add a toolbar toggle). */
  allowLoopHoverAudio = true,
}: {
  displayName: string;
  videoPreview?: EmployeeVideoPreview;
  /** When true and `subscribeArachne` is set, wire `avatar.*` WS events into the canvas layer. */
  arachneStreamEnabled?: boolean;
  subscribeArachne?: (cb: (ev: ArachneXEvent) => void) => () => void;
  /** RunPod segment clips: realtime first, optional enhanced crossfade (muted; Realtime audio stays primary). */
  segmentOverlay?: AvatarSegmentOverlay | null;
  /** Optional: audio-first perception state (does not change layout). */
  digitalHumanState?: AvatarState;
  /** Lip-sync mode: ElevenLabs audio + optional InfiniteTalk video (same turn). */
  syncPlayback?: AvatarSyncResponse | null;
  onSyncPlaybackEnd?: () => void;
  allowLoopHoverAudio?: boolean;
}) {
  const letter = initials(displayName);
  const src = videoPreview?.src?.trim();

  const { canvasRef, containerRef, showStubOverlay, showLiveCanvas } =
    useAvatarArachneVideoStream(subscribeArachne, arachneStreamEnabled);

  const loopVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [loopMuted, setLoopMuted] = React.useState(true);

  React.useEffect(() => {
    setLoopMuted(true);
    const v = loopVideoRef.current;
    if (v) v.muted = true;
  }, [src]);

  React.useEffect(() => {
    if (showLiveCanvas) {
      setLoopMuted(true);
      const v = loopVideoRef.current;
      if (v) v.muted = true;
    }
  }, [showLiveCanvas]);

  React.useEffect(() => {
    if (!allowLoopHoverAudio) {
      setLoopMuted(true);
      const v = loopVideoRef.current;
      if (v) v.muted = true;
    }
  }, [allowLoopHoverAudio]);

  const onLoopPointerEnter = React.useCallback(() => {
    if (showLiveCanvas || !src || !allowLoopHoverAudio) return;
    const v = loopVideoRef.current;
    if (!v) return;
    v.muted = false;
    setLoopMuted(false);
    void v.play().catch(() => {
      v.muted = true;
      setLoopMuted(true);
    });
  }, [allowLoopHoverAudio, showLiveCanvas, src]);

  const onLoopPointerLeave = React.useCallback(() => {
    const v = loopVideoRef.current;
    if (!v) return;
    v.muted = true;
    setLoopMuted(true);
  }, []);

  const hasSegment =
    segmentOverlay &&
    (segmentOverlay.realtimeSrc || segmentOverlay.enhancedSrc);

  const perceptionHint = digitalHumanState
    ? avatarStateFooterHint(digitalHumanState)
    : null;

  const footerLabel = showLiveCanvas
    ? "Live stream · ARACHNE-X (JPEG)"
    : showStubOverlay
      ? "Avatar stream · waiting for frames (stub)"
      : hasSegment
        ? "Segment video · RunPod (muted overlay · Realtime audio)"
        : src
          ? arachneStreamEnabled
            ? "Loop clip + live face when ARACHNE streams JPEG"
            : "NULLXES DIGITAL HUMAN"
          : arachneStreamEnabled
            ? "Connect ARACHNE WS for live face"
            : "No clip yet · run auto avatar or identity preview";

  const footerSecondary =
    perceptionHint && digitalHumanState !== "idle"
      ? ` · ${perceptionHint}`
      : "";

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <div
        className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-neutral-800 bg-linear-to-br from-neutral-900 via-neutral-950 to-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        aria-label={
          src && !showLiveCanvas && allowLoopHoverAudio
            ? "Avatar preview video · hover for sound"
            : src
              ? "Avatar preview video"
              : "Avatar stream placeholder"
        }
        title={
          src && !showLiveCanvas && allowLoopHoverAudio
            ? "Hover for sound"
            : undefined
        }
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(120,120,120,0.12),transparent_55%)]" />

        {/* Base: recorded preview or initials */}
        <div
          className={
            showLiveCanvas ? "absolute inset-0 opacity-30" : "absolute inset-0"
          }
          aria-hidden={showLiveCanvas}
        >
          {src ? (
            <video
              ref={loopVideoRef}
              className="absolute inset-0 size-full object-cover"
              src={src}
              controls={!showLiveCanvas}
              playsInline
              loop
              muted={showLiveCanvas ? true : loopMuted}
              preload="metadata"
              autoPlay={!showLiveCanvas}
              onPointerEnter={
                !showLiveCanvas && allowLoopHoverAudio
                  ? onLoopPointerEnter
                  : undefined
              }
              onPointerLeave={
                !showLiveCanvas && allowLoopHoverAudio
                  ? onLoopPointerLeave
                  : undefined
              }
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Avatar className="size-32 border-2 border-neutral-700/80 shadow-lg">
                <AvatarFallback className="bg-neutral-800 text-3xl font-medium text-neutral-200">
                  {letter}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* JPEG stream layer */}
        <div ref={containerRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className={
              showLiveCanvas
                ? "absolute inset-0 size-full object-contain"
                : "pointer-events-none absolute inset-0 size-full opacity-0"
            }
            aria-hidden={!showLiveCanvas}
          />
        </div>

        {hasSegment ? (
          <div
            className="pointer-events-none absolute inset-0 z-5"
            aria-hidden
          >
            {segmentOverlay.realtimeSrc ? (
              <video
                key={`rt-${segmentOverlay.sequence}-${segmentOverlay.realtimeSrc}`}
                className="absolute inset-0 size-full object-cover"
                src={segmentOverlay.realtimeSrc}
                muted
                playsInline
                autoPlay
                preload="auto"
              />
            ) : null}
            {segmentOverlay.enhancedSrc ? (
              <video
                key={`hq-${segmentOverlay.sequence}-${segmentOverlay.enhancedSrc}`}
                className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out ${
                  segmentOverlay.enhancedActive ? "opacity-100" : "opacity-0"
                }`}
                src={segmentOverlay.enhancedSrc}
                muted
                playsInline
                autoPlay
                preload="auto"
              />
            ) : null}
          </div>
        ) : null}

        <SyncAvatarPlaybackLayer
          payload={syncPlayback ?? null}
          onPlaybackEnd={onSyncPlaybackEnd}
        />

        {showStubOverlay ? (
          <div
            className="absolute inset-0 flex items-center justify-center bg-neutral-950/50 backdrop-blur-[2px]"
            aria-busy
            aria-label="Avatar loading"
          >
            <Loader2 className="size-10 animate-spin text-neutral-400" />
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 border-t border-neutral-800/80 bg-neutral-950/85 px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-neutral-500 backdrop-blur-sm">
          {footerLabel}
          {footerSecondary}
        </div>
      </div>
    </div>
  );
}
