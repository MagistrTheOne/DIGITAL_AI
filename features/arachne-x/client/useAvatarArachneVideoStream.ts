"use client";

import * as React from "react";

import type { ArachneXEvent } from "@/features/arachne-x/event-system/eventTypes";

export type AvatarArachneStreamUi = {
  /** ARACHNE avatar.state.changed */
  wireAvatarState: "idle" | "speaking" | "thinking" | "listening";
  /** Video chunks without JPEG payload (stub). */
  stubVideoChunks: boolean;
  /** At least one jpeg frame drawn this “segment”. */
  liveJpegActive: boolean;
};

const initialUi: AvatarArachneStreamUi = {
  wireAvatarState: "idle",
  stubVideoChunks: false,
  liveJpegActive: false,
};

function isJpegVideoChunk(
  ev: ArachneXEvent,
): ev is Extract<ArachneXEvent, { type: "avatar.stream.chunk" }> & {
  kind: "video";
  encoding: "jpeg_base64";
  data: string;
} {
  if (ev.type !== "avatar.stream.chunk" || ev.kind !== "video") return false;
  return (
    ev.encoding === "jpeg_base64" &&
    typeof ev.data === "string" &&
    ev.data.length > 0
  );
}

/**
 * Decodes ARACHNE `avatar.stream.chunk` JPEG frames off the WebSocket critical path.
 * Drops backlog to ~2 pending decodes so slow draws do not stall the socket handler.
 */
export function useAvatarArachneVideoStream(
  subscribe: ((cb: (ev: ArachneXEvent) => void) => () => void) | undefined,
  enabled: boolean,
) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ui, setUi] = React.useState<AvatarArachneStreamUi>(initialUi);

  const decodeQueueRef = React.useRef<string[]>([]);
  const decodingRef = React.useRef(false);
  const rafDrawRef = React.useRef<number | null>(null);

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const box = containerRef.current;
    if (!canvas || !box) return;
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const w = Math.max(1, Math.floor(box.clientWidth * dpr));
    const h = Math.max(1, Math.floor(box.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }, []);

  React.useLayoutEffect(() => {
    if (!enabled) return;
    resizeCanvas();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => resizeCanvas());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [enabled, resizeCanvas]);

  const pumpDecode = React.useCallback(() => {
    if (decodingRef.current) return;
    const next = decodeQueueRef.current.shift();
    if (!next) return;

    decodingRef.current = true;
    void (async () => {
      try {
        const bytes = Uint8Array.from(atob(next), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "image/jpeg" });
        if (typeof createImageBitmap === "undefined") {
          decodingRef.current = false;
          void pumpDecode();
          return;
        }
        const bmp = await createImageBitmap(blob);
        if (rafDrawRef.current != null) {
          cancelAnimationFrame(rafDrawRef.current);
        }
        rafDrawRef.current = requestAnimationFrame(() => {
          rafDrawRef.current = null;
          try {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                resizeCanvas();
                ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
              }
            }
          } finally {
            try {
              bmp.close();
            } catch {
              /* ignore */
            }
            decodingRef.current = false;
            void pumpDecode();
          }
        });
      } catch {
        decodingRef.current = false;
        void pumpDecode();
      }
    })();
  }, [resizeCanvas]);

  const enqueueJpeg = React.useCallback(
    (b64: string) => {
      decodeQueueRef.current.push(b64);
      while (decodeQueueRef.current.length > 2) {
        decodeQueueRef.current.shift();
      }
      void pumpDecode();
    },
    [pumpDecode],
  );

  React.useEffect(() => {
    if (!enabled || !subscribe) {
      setUi(initialUi);
      decodeQueueRef.current = [];
      return;
    }

    return subscribe((ev: ArachneXEvent) => {
      if (ev.type === "avatar.state.changed") {
        if (ev.state === "idle") {
          decodeQueueRef.current = [];
          decodingRef.current = false;
          setUi({
            wireAvatarState: "idle",
            stubVideoChunks: false,
            liveJpegActive: false,
          });
          requestAnimationFrame(() => {
            const c = canvasRef.current;
            if (c) {
              const ctx = c.getContext("2d");
              ctx?.clearRect(0, 0, c.width, c.height);
            }
          });
          return;
        }
        if (ev.state === "speaking") {
          decodeQueueRef.current = [];
          decodingRef.current = false;
          setUi({
            wireAvatarState: "speaking",
            stubVideoChunks: false,
            liveJpegActive: false,
          });
          return;
        }
        setUi((prev) => ({
          ...prev,
          wireAvatarState: ev.state,
        }));
        return;
      }

      if (ev.type === "avatar.stream.chunk" && ev.kind === "video") {
        if (isJpegVideoChunk(ev)) {
          setUi((prev) => ({
            ...prev,
            stubVideoChunks: false,
            liveJpegActive: true,
          }));
          enqueueJpeg(ev.data);
        } else {
          setUi((prev) => ({
            ...prev,
            stubVideoChunks: true,
          }));
        }
      }
    });
  }, [enabled, subscribe, enqueueJpeg]);

  React.useEffect(() => {
    return () => {
      if (rafDrawRef.current != null) cancelAnimationFrame(rafDrawRef.current);
    };
  }, []);

  const showStubOverlay =
    enabled &&
    (ui.wireAvatarState === "speaking" ||
      ui.wireAvatarState === "listening" ||
      ui.wireAvatarState === "thinking") &&
    ui.stubVideoChunks &&
    !ui.liveJpegActive;

  const showLiveCanvas = enabled && ui.liveJpegActive;

  return {
    canvasRef,
    containerRef,
    streamUi: ui,
    showStubOverlay,
    showLiveCanvas,
  };
}
