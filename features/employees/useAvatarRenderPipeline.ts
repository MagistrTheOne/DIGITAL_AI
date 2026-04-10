"use client";

import * as React from "react";

import {
  AVATAR_SEGMENT_TEXT_MAX_CHARS,
  type VideoSegment,
} from "@/features/employees/avatar-digital-human.types";

export type AvatarSegmentOverlay = {
  sequence: number;
  realtimeSrc: string | null;
  enhancedSrc: string | null;
  /** When true, enhanced layer fades in over realtime (visual-only; Realtime audio unchanged). */
  enhancedActive: boolean;
};

type RenderJobDto = {
  jobId: string;
  videoTier: "realtime" | "enhanced";
  engine: string;
  status: string;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Enqueues RunPod avatar jobs per assistant segment and polls status until ready or superseded.
 */
export function useAvatarRenderPipeline(input: {
  enabled: boolean;
  sessionId: string;
  employeeId: string;
  hybridEnhance: boolean;
}): {
  notifyAssistantSegment: (text: string) => void;
  segmentOverlay: AvatarSegmentOverlay | null;
  /** Visual queue metadata (audio is independent; late clips skipped via sequence). */
  videoSegment: VideoSegment | null;
} {
  const latestSeqRef = React.useRef(0);
  const [segmentOverlay, setSegmentOverlay] =
    React.useState<AvatarSegmentOverlay | null>(null);
  const [videoSegment, setVideoSegment] = React.useState<VideoSegment | null>(
    null,
  );

  const { enabled, sessionId, employeeId, hybridEnhance } = input;

  const notifyAssistantSegment = React.useCallback(
    (text: string) => {
      if (!enabled || !text.trim()) return;

      const trimmed = text.trim().slice(0, AVATAR_SEGMENT_TEXT_MAX_CHARS);
      if (!trimmed) return;

      const seq = ++latestSeqRef.current;
      setSegmentOverlay({
        sequence: seq,
        realtimeSrc: null,
        enhancedSrc: null,
        enhancedActive: false,
      });
      setVideoSegment({
        sequence: seq,
        status: "pending",
      });

      void (async () => {
        try {
          const res = await fetch("/api/avatar/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              employeeId,
              sequence: seq,
              text: trimmed,
              hybridEnhance,
            }),
          });
          if (!res.ok) {
            setSegmentOverlay((prev) =>
              prev?.sequence === seq ? null : prev,
            );
            setVideoSegment((prev) =>
              prev?.sequence === seq ? null : prev,
            );
            return;
          }
          const data = (await res.json()) as { jobs?: RenderJobDto[] };
          const jobs = Array.isArray(data.jobs) ? data.jobs : [];
          const rt = jobs.find((j) => j.videoTier === "realtime");
          const hq = jobs.find((j) => j.videoTier === "enhanced");

          if (!rt?.jobId && !hq?.jobId) {
            setSegmentOverlay((prev) =>
              prev?.sequence === seq ? null : prev,
            );
            setVideoSegment((prev) =>
              prev?.sequence === seq ? null : prev,
            );
            return;
          }

          const pollJob = async (
            jobId: string,
            onReady: (videoUrl: string) => void,
          ) => {
            for (let i = 0; i < 120; i++) {
              if (latestSeqRef.current !== seq) return;
              const stRes = await fetch(
                `/api/avatar/status?id=${encodeURIComponent(jobId)}`,
              );
              if (!stRes.ok) {
                await sleep(2000);
                continue;
              }
              const st = (await stRes.json()) as {
                status?: string;
                videoUrl?: string | null;
              };
              if (st.status === "ready" && st.videoUrl) {
                onReady(st.videoUrl);
                return;
              }
              if (st.status === "failed") return;
              await sleep(2000);
            }
          };

          if (rt?.jobId) {
            void pollJob(rt.jobId, (videoUrl) => {
              if (latestSeqRef.current !== seq) return;
              setSegmentOverlay((prev) =>
                prev && prev.sequence === seq
                  ? { ...prev, realtimeSrc: videoUrl }
                  : prev,
              );
              setVideoSegment((prev) =>
                prev && prev.sequence === seq
                  ? { ...prev, status: "ready", videoUrl }
                  : prev,
              );
            });
          }

          if (hq?.jobId) {
            void pollJob(hq.jobId, (videoUrl) => {
              if (latestSeqRef.current !== seq) return;
              setSegmentOverlay((prev) =>
                prev && prev.sequence === seq
                  ? {
                      ...prev,
                      enhancedSrc: videoUrl,
                      enhancedActive: true,
                    }
                  : prev,
              );
              setVideoSegment((prev) =>
                prev && prev.sequence === seq
                  ? { ...prev, status: "ready", enhancedUrl: videoUrl }
                  : prev,
              );
            });
          }
        } catch {
          /* ignore */
        }
      })();
    },
    [enabled, sessionId, employeeId, hybridEnhance],
  );

  return { notifyAssistantSegment, segmentOverlay, videoSegment };
}
