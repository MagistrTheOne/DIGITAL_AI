"use client";

import * as React from "react";

export function VideoPlayer({
  src,
  className,
  unmuteOnHover = true,
  autoPlay = false,
  pauseOnLeave = true,
  primeAudioOnPointerDown = false,
}: {
  src: string;
  className?: string;
  /** Hover-triggered unmute can fail due to browser autoplay policies. */
  unmuteOnHover?: boolean;
  /** Start muted loop playback on mount (catalog cards). */
  autoPlay?: boolean;
  /** If false, only mute on leave — keep playback and time (loop preview). */
  pauseOnLeave?: boolean;
  /** First pointerdown tries unmuted play (user gesture) to unlock hover audio. */
  primeAudioOnPointerDown?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = React.useState(true);
  const primedRef = React.useRef(false);

  React.useEffect(() => {
    primedRef.current = false;
  }, [src]);

  React.useEffect(() => {
    if (!autoPlay) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    setMuted(true);
    void video.play().catch(() => {});
  }, [autoPlay, src]);

  const playWithOptionalUnmute = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = !unmuteOnHover;
      setMuted(video.muted);
      await video.play();
    } catch {
      try {
        video.muted = true;
        setMuted(true);
        await video.play();
      } catch {
        // no-op
      }
    }
  }, [unmuteOnHover]);

  const pauseAndReset = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.pause();
      video.currentTime = 0;
    } catch {
      // no-op
    }
    video.muted = true;
    setMuted(true);
  }, []);

  const onPointerLeave = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (pauseOnLeave) {
      pauseAndReset();
    } else {
      video.muted = true;
      setMuted(true);
    }
  }, [pauseOnLeave, pauseAndReset]);

  const onPrimePointerDown = React.useCallback(async () => {
    if (!primeAudioOnPointerDown || primedRef.current) return;
    primedRef.current = true;
    const video = videoRef.current;
    if (!video) return;
    try {
      video.muted = false;
      setMuted(false);
      await video.play();
    } catch {
      try {
        video.muted = true;
        setMuted(true);
        await video.play();
      } catch {
        // no-op
      }
    }
  }, [primeAudioOnPointerDown]);

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      muted={muted}
      playsInline
      preload="metadata"
      loop
      onPointerEnter={playWithOptionalUnmute}
      onPointerLeave={onPointerLeave}
      onPointerDown={primeAudioOnPointerDown ? onPrimePointerDown : undefined}
    />
  );
}
