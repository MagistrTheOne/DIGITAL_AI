"use client";

import * as React from "react";

import type { AvatarSyncResponse } from "@/features/employees/avatar-sync.client";

/**
 * Plays ElevenLabs audio as source of truth; when video exists, starts both together (video muted).
 */
export function SyncAvatarPlaybackLayer({
  payload,
  onPlaybackEnd,
}: {
  payload: AvatarSyncResponse | null;
  onPlaybackEnd?: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    startedRef.current = false;
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!payload || !audio) return;

    const end = () => {
      onPlaybackEnd?.();
    };

    const startTogether = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      audio.currentTime = 0;
      const pVideo = video && payload.videoUrl ? video : null;
      if (pVideo) {
        pVideo.currentTime = 0;
        void pVideo.play().catch(() => {});
      }
      void audio.play().catch(() => {});
    };

    let audioReady = false;
    let videoReady = !payload.videoUrl;

    const bump = () => {
      if (audioReady && videoReady) startTogether();
    };

    audio.onended = () => end();
    audio.onerror = () => end();

    const onAudioReady = () => {
      audioReady = true;
      bump();
    };

    if (payload.videoUrl && video) {
      video.onended = () => end();
      video.onerror = () => {
        videoReady = true;
        bump();
      };
      video.oncanplaythrough = () => {
        videoReady = true;
        bump();
      };
      video.src = payload.videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.load();
    }

    audio.oncanplaythrough = onAudioReady;
    audio.src = payload.audioUrl;
    audio.load();

    return () => {
      audio.oncanplaythrough = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (video) {
        video.oncanplaythrough = null;
        video.onended = null;
        video.onerror = null;
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [payload, onPlaybackEnd]);

  if (!payload) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden
    >
      {payload.videoUrl ? (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          playsInline
          muted
          preload="auto"
        />
      ) : null}
      <audio ref={audioRef} className="hidden" preload="auto" />
    </div>
  );
}
