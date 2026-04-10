"use client";

import * as React from "react";

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
} {
  const latestSeqRef = React.useRef(0);
  const [segmentOverlay, setSegmentOverlay] =
    React.useState<AvatarSegmentOverlay | null>(null);

  const { enabled, sessionId, employeeId, hybridEnhance } = input;

  const notifyAssistantSegment = React.useCallback(
    (text: string) => {
      if (!enabled || !text.trim()) return;

      const seq = ++latestSeqRef.current;
      setSegmentOverlay({
        sequence: seq,
        realtimeSrc: null,
        enhancedSrc: null,
        enhancedActive: false,
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
              text: text.trim(),
              hybridEnhance,
            }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { jobs?: RenderJobDto[] };
          const jobs = Array.isArray(data.jobs) ? data.jobs : [];
          const rt = jobs.find((j) => j.videoTier === "realtime");
          const hq = jobs.find((j) => j.videoTier === "enhanced");

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
            });
          }
        } catch {
          /* ignore */
        }
      })();
    },
    [enabled, sessionId, employeeId, hybridEnhance],
  );

  return { notifyAssistantSegment, segmentOverlay };
}
