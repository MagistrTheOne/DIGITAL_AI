"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const MIRA_VIDEO_SRC = "/avatars/Mira/mira.mp4";

export type MiraLoopPreviewVariant = "standalone" | "embedded";

type Props = {
  /** `standalone` — скругления и рамка (шаг Preview в мастере). `embedded` — заполняет родителя (карточка в каталоге). */
  variant?: MiraLoopPreviewVariant;
  className?: string;
};

/**
 * Зацикленное видео Mira; звук только при наведении (muted autoplay).
 */
export function MiraLoopPreview({
  variant = "standalone",
  className,
}: Props) {
  const ref = React.useRef<HTMLVideoElement | null>(null);

  const ensurePlayingMuted = React.useCallback(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => {
      /* autoplay */
    });
  }, []);

  React.useEffect(() => {
    ensurePlayingMuted();
  }, [ensurePlayingMuted]);

  const onPointerEnter = React.useCallback(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    void v.play().catch(() => undefined);
  }, []);

  const onPointerLeave = React.useCallback(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
  }, []);

  const embedded = variant === "embedded";

  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-neutral-950",
        embedded
          ? "h-full w-full"
          : "rounded-xl border border-neutral-800",
        className,
      )}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div
        className={cn(
          "relative flex w-full items-center justify-center bg-neutral-950",
          embedded ? "h-full min-h-32" : "aspect-video",
        )}
      >
        {/* object-contain: full frame visible (face not cropped like object-cover) */}
        <video
          ref={ref}
          className="h-full w-full max-h-full bg-neutral-950 object-contain"
          src={MIRA_VIDEO_SRC}
          loop
          muted
          playsInline
          preload="metadata"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent",
            embedded ? "px-2 py-1.5" : "px-3 py-2",
          )}
        >
          <p
            className={cn(
              "text-neutral-300",
              embedded ? "text-[10px]" : "text-[11px]",
            )}
          >
            <span className="text-neutral-100">Preview Avatar</span>
            <span
              className={cn(
                "ml-2 text-neutral-500 group-hover:text-emerald-400/90",
              )}
            >
              Hover for sound
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Показывать ролик Mira в карточке каталога (MIRAZ / Mira и т.п.). */
export function isMiraCatalogPreviewName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (n.includes("miraz")) return true;
  return /\bmira\b/.test(n);
}
