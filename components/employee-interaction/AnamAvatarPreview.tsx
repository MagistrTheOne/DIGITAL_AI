"use client";

import * as React from "react";

import {
  AnamAudioControls,
  getStoredAnamMicDeviceId,
} from "@/components/employee-interaction/AnamAudioControls";
import { AnamSessionToolbar } from "@/components/employee-interaction/AnamSessionToolbar";
import { createClient, type AnamClient } from "@anam-ai/js-sdk";

type Props = {
  employeeId: string;
  displayName: string;
};

type SessionStatus = "loading" | "live" | "error" | "stopped";

export function AnamAvatarPreview({ employeeId, displayName }: Props) {
  const videoId = React.useMemo(
    () => `anam-video-${employeeId.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    [employeeId],
  );
  const [activeSession, setActiveSession] = React.useState(true);
  const [status, setStatus] = React.useState<SessionStatus>("loading");
  const [message, setMessage] = React.useState<string | null>(null);
  const [needsSoundGesture, setNeedsSoundGesture] = React.useState(false);
  const [micMuted, setMicMuted] = React.useState(false);
  const clientRef = React.useRef<AnamClient | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const unlockAudio = React.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.volume = 1;
    void el.play().then(() => setNeedsSoundGesture(false));
  }, []);

  React.useEffect(() => {
    if (!activeSession) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setStatus("loading");
        setMessage(null);

        const res = await fetch("/api/anam/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId }),
        });
        const data = (await res.json()) as { sessionToken?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `Session failed (${res.status})`);
        }
        if (!data.sessionToken) {
          throw new Error("No session token");
        }

        const client = createClient(data.sessionToken, {
          audioDeviceId: getStoredAnamMicDeviceId(),
        });
        clientRef.current = client;

        await client.streamToVideoElement(videoId);
        if (!cancelled) {
          setStatus("live");
          setMessage(null);
          try {
            if (micMuted) client.muteInputAudio();
            else client.unmuteInputAudio();
          } catch {
            /* ignore */
          }
          queueMicrotask(() => {
            const el = videoRef.current;
            if (!el || cancelled) return;
            el.muted = false;
            el.volume = 1;
            void el.play().catch(() => {
              if (!cancelled) setNeedsSoundGesture(true);
            });
          });
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setMessage(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
      const c = clientRef.current;
      clientRef.current = null;
      if (c) {
        void c.stopStreaming().catch(() => undefined);
      }
      const el = videoRef.current;
      if (el) {
        el.srcObject = null;
      }
    };
  }, [employeeId, videoId, activeSession]);

  React.useEffect(() => {
    if (status !== "live") return;
    const c = clientRef.current;
    if (!c) return;
    try {
      if (micMuted) c.muteInputAudio();
      else c.unmuteInputAudio();
    } catch {
      /* ignore */
    }
  }, [status, micMuted]);

  const stopSession = React.useCallback(() => {
    setActiveSession(false);
    setStatus("stopped");
    setNeedsSoundGesture(false);
  }, []);

  const startSession = React.useCallback(() => {
    setActiveSession(true);
  }, []);

  const retrySession = React.useCallback(() => {
    setActiveSession(false);
    queueMicrotask(() => setActiveSession(true));
  }, []);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-lg">
        <video
          ref={videoRef}
          id={videoId}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
        />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/80 text-sm text-neutral-400">
            Connecting to Anam…
          </div>
        )}
        {status === "stopped" && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 text-sm text-neutral-400">
            Session stopped
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-950/90 p-4 text-center text-xs text-red-300">
            <span>Anam preview failed</span>
            {message && (
              <span className="text-neutral-500">{message}</span>
            )}
          </div>
        )}
        {status === "live" && needsSoundGesture && (
          <button
            type="button"
            onClick={unlockAudio}
            className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-amber-600/80 bg-amber-950/90 px-4 py-2 text-xs font-medium text-amber-100 shadow-lg transition hover:bg-amber-900/90"
          >
            Enable sound (browser requires a tap)
          </button>
        )}
      </div>
      <p className="text-center text-[11px] text-neutral-500">
        {displayName} — Anam live preview{" "}
        {status === "live" ? "(streaming)" : ""}
        {status === "stopped" ? "(stopped)" : ""}
      </p>

      <AnamSessionToolbar
        status={status}
        micMuted={micMuted}
        onMicMutedChange={setMicMuted}
        onStopSession={stopSession}
        onStartSession={startSession}
        onRetry={retrySession}
      />

      <p className="text-center text-[11px] text-neutral-600">
        Voice is always listening while the mic is on — use the switch to mute.
      </p>

      <AnamAudioControls status={status} videoRef={videoRef} clientRef={clientRef} />
    </div>
  );
}
