"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { VideoPlayer } from "@/components/media/VideoPlayer";
import { Button } from "@/components/ui/button";
import type {
  AvatarRenderStage,
  RenderStatus,
} from "@/features/employees/avatar-preview.types";
import { useAvatarPreviewGeneration } from "@/features/employees/useAvatarPreviewGeneration";

const HIDE_PREVIEW_BTN_KEY = "nullxes.hideAvatarPreviewGenerate";

export function AvatarPreviewSection({
  employeeId,
  visible,
  generateEnabled,
  identityClipEnabled = false,
  identityClipImageUrl = null,
  identityClipIntroText,
  initialRenderStatus,
  initialVideoUrl,
  initialJobId,
  initialError,
  autoDigitalHumanEnabled = false,
  initialRenderStage = null,
  className,
  /** When set (e.g. create wizard), avoids full route refresh that would reset client state. */
  onRefreshOverride,
}: {
  employeeId: string;
  /** When false, entire block hidden (no ARACHNE and no in-flight preview). */
  visible: boolean;
  /** Legacy preview: POST /avatar-preview requires ARACHNE_AVATAR_PREVIEW_URL. */
  generateEnabled: boolean;
  /** RunPod InfiniteTalk one-shot identity (requires https reference image). */
  identityClipEnabled?: boolean;
  identityClipImageUrl?: string | null;
  identityClipIntroText?: string;
  initialRenderStatus: RenderStatus;
  initialVideoUrl: string | null;
  initialJobId: string | null;
  initialError: string | null;
  /** Post-deploy auto pipeline (NULLXES_AUTO_DIGITAL_HUMAN=1 + keys) — enables polling + retry route. */
  autoDigitalHumanEnabled?: boolean;
  initialRenderStage?: AvatarRenderStage | null;
  className?: string;
  onRefreshOverride?: () => void;
}) {
  const router = useRouter();
  const onRefresh = React.useCallback(() => {
    if (onRefreshOverride) {
      onRefreshOverride();
      return;
    }
    router.refresh();
  }, [onRefreshOverride, router]);

  const preview = useAvatarPreviewGeneration({
    employeeId,
    initialRenderStatus,
    initialVideoUrl,
    initialJobId,
    initialError,
    onRefresh,
    identityClipEnabled,
    identityClipImageUrl,
    identityClipIntroText,
    autoDigitalHumanEnabled,
    initialRenderStage,
  });

  const stageActive = (s: AvatarRenderStage) =>
    preview.renderStatus === "generating" && preview.renderStage === s;

  const canGenerate =
    generateEnabled ||
    (identityClipEnabled && Boolean(identityClipImageUrl?.trim()));

  const [hiddenForSession, setHiddenForSession] = React.useState(false);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(HIDE_PREVIEW_BTN_KEY) === "1") {
        setHiddenForSession(true);
      }
    } catch {
      /* private mode */
    }
  }, []);

  if (!visible || hiddenForSession) return null;

  const showAutoHumanProgress =
    autoDigitalHumanEnabled && preview.renderStatus === "generating";
  const showSkeleton =
    !showAutoHumanProgress &&
    (preview.renderStatus === "generating" || preview.busy) &&
    !preview.videoUrl;
  const showVideo = Boolean(preview.videoUrl);

  return (
    <div className={className ?? "flex max-w-md flex-col items-center gap-2 px-2"}>
      {showVideo ? (
        <div className="w-full overflow-hidden rounded-lg border border-neutral-800 bg-black/40">
          <VideoPlayer
            key={preview.videoUrl ?? "v"}
            src={preview.videoUrl!}
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : null}

      {showAutoHumanProgress ? (
        <div className="flex w-full max-w-sm flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2.5 text-left">
          <p className="text-xs font-medium text-neutral-200">
            Creating digital human…
          </p>
          <p className="text-[11px] leading-snug text-neutral-500">
            Пока создаётся цифровой человек — налей себе чай ☕
          </p>
          <ul className="space-y-1 text-[11px] text-neutral-500">
            <li
              className={
                stageActive("face") ? "font-medium text-neutral-200" : undefined
              }
            >
              {stageActive("face") ? "→ " : ""}Creating face
            </li>
            <li
              className={
                stageActive("voice") ? "font-medium text-neutral-200" : undefined
              }
            >
              {stageActive("voice") ? "→ " : ""}Generating voice
            </li>
            <li
              className={
                stageActive("video") ? "font-medium text-neutral-200" : undefined
              }
            >
              {stageActive("video") ? "→ " : ""}Rendering video
            </li>
          </ul>
        </div>
      ) : null}

      {showSkeleton ? (
        <div
          className="flex aspect-video w-full max-w-sm animate-pulse items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/60"
          aria-hidden
        >
          <span className="text-[10px] text-neutral-600">
            {autoDigitalHumanEnabled ? "Rendering…" : "Generating preview…"}
          </span>
        </div>
      ) : null}

      <p className="text-center text-[10px] leading-snug text-neutral-500">
        {preview.label}
      </p>

      {canGenerate ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          disabled={preview.busy}
          onClick={() => void preview.generate()}
        >
          {preview.busy ? "Working…" : "Generate avatar preview"}
        </Button>
      ) : null}

      {preview.error ? (
        <div
          className="flex max-w-sm flex-col items-center gap-2 text-center"
          role="alert"
        >
          <p className="text-xs leading-snug text-red-400/90">{preview.error}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-neutral-400 hover:text-neutral-200"
              onClick={() => void preview.retry()}
            >
              Retry
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-neutral-400 hover:text-neutral-200"
              onClick={() => {
                setHiddenForSession(true);
                try {
                  sessionStorage.setItem(HIDE_PREVIEW_BTN_KEY, "1");
                } catch {
                  /* ignore */
                }
              }}
            >
              Hide controls
            </Button>
          </div>
        </div>
      ) : generateEnabled ? (
        <p className="text-center text-[10px] leading-snug text-neutral-600">
          Async jobs poll automatically. Status updates from the server.
        </p>
      ) : null}
    </div>
  );
}
