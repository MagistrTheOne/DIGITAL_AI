"use client";

import * as React from "react";

export function VideoPlayer({
  src,
  className,
  unmuteOnHover = true,
}: {
  src: string;
  className?: string;
  // Hover-triggered unmute can fail due to browser autoplay policies.
  unmuteOnHover?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = React.useState(true);

  const playWithOptionalUnmute = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = !unmuteOnHover;
      setMuted(video.muted);
      await video.play();
    } catch {
      // Autoplay/unmute policies can block unmuting.
      try {
        video.muted = true;
        setMuted(true);
        await video.play();
      } catch {
        // no-op: preview will remain stopped.
      }
    }
  };

  const pauseAndReset = () => {
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
  };

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      muted={muted}
      playsInline
      preload="metadata"
      loop
      onMouseEnter={playWithOptionalUnmute}
      onMouseLeave={pauseAndReset}
    />
  );
}

