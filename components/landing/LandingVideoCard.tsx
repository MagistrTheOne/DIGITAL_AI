"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";

const VIDEO_SRC = "/avatars/Mira/mira.mp4";

type Props = {
  className?: string;
  /** Fill available column height (hero) instead of fixed aspect phone frame. */
  variant?: "hero" | "compact";
};

export function LandingVideoCard({ className, variant = "compact" }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const blurVideoRef = React.useRef<HTMLVideoElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 });
  /** When false, sound is off (muted). When true, hover can unmute. */
  const [soundArm, setSoundArm] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);

  const applyMute = React.useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const shouldMute = !soundArm || !hovering;
    v.muted = shouldMute;
  }, [soundArm, hovering]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.loop = true;
    v.playsInline = true;
    v.muted = true;
    void v.play().catch(() => {});
    const b = blurVideoRef.current;
    if (b) {
      b.loop = true;
      b.playsInline = true;
      b.muted = true;
      void b.play().catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    applyMute();
  }, [applyMute]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: py * -14, ry: px * 14 });
  };

  const onLeave = () => {
    setHovering(false);
    setTilt({ rx: 0, ry: 0 });
  };

  const onEnter = () => {
    setHovering(true);
    void videoRef.current?.play().catch(() => {});
    void blurVideoRef.current?.play().catch(() => {});
  };

  const isHero = variant === "hero";

  const syncBlurTime = React.useCallback(() => {
    const v = videoRef.current;
    const b = blurVideoRef.current;
    if (!v || !b || !isHero) return;
    if (Math.abs(b.currentTime - v.currentTime) > 0.12) {
      try {
        b.currentTime = v.currentTime;
      } catch {
        /* seek may fail before metadata */
      }
    }
  }, [isHero]);

  const toggleSoundArm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSoundArm((a) => !a);
  };

  const rootClass = ["flex flex-col", isHero ? "h-full min-h-0" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      style={{ perspective: "1100px" }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerEnter={onEnter}
    >
      <div
        ref={frameRef}
        className={`mx-auto flex w-full origin-center transform-3d flex-col transition-transform duration-200 ease-out will-change-transform ${
          isHero
            ? "h-full min-h-0 max-h-[min(88dvh,900px)] max-w-[min(100%,320px)]"
            : "max-w-[min(100%,280px)]"
        }`}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/15 bg-neutral-950 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
          <button
            type="button"
            onClick={toggleSoundArm}
            className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-neutral-300 backdrop-blur-sm transition hover:border-white/35 hover:text-white"
            aria-label={soundArm ? "Mute video sound" : "Enable sound on hover"}
            title={
              soundArm
                ? "Sound on (hover to hear). Click to mute."
                : "Sound off. Click to allow sound on hover."
            }
          >
            {soundArm ? (
              <Volume2 className="size-4" aria-hidden />
            ) : (
              <VolumeX className="size-4" aria-hidden />
            )}
          </button>
          <div
            className={`relative min-h-0 w-full flex-1 overflow-hidden bg-black ${
              isHero ? "" : "aspect-9/16"
            }`}
          >
            {isHero ? (
              <>
                <div className="absolute inset-0 z-0" aria-hidden>
                  <video
                    ref={blurVideoRef}
                    src={VIDEO_SRC}
                    className="pointer-events-none h-full min-h-full w-full min-w-full scale-125 object-cover opacity-45 blur-3xl"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    tabIndex={-1}
                  />
                </div>
                <video
                  ref={videoRef}
                  src={VIDEO_SRC}
                  className="relative z-10 h-full w-full object-cover object-center"
                  onTimeUpdate={syncBlurTime}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="NULLXES digital employee preview"
                />
              </>
            ) : (
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                className="h-full w-full object-contain"
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="NULLXES digital employee preview"
              />
            )}
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-neutral-500">
          Our digital employee.
        </p>
      </div>
    </div>
  );
}
