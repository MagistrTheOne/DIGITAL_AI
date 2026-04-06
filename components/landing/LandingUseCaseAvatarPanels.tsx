"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  USE_CASE_AVATARS,
  type UseCaseAvatar,
  avatarVideoUrls,
} from "@/lib/landing/use-case-avatars";

function UseCaseAvatarCard({
  avatar,
  audioActive,
  onToggleAudio,
  tilt,
  onPointerMove,
  onPointerLeave,
}: {
  avatar: UseCaseAvatar;
  audioActive: boolean;
  onToggleAudio: () => void;
  tilt: { rx: number; ry: number };
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
}) {
  const candidates = React.useMemo(() => avatarVideoUrls(avatar), [avatar]);
  const [urlIndex, setUrlIndex] = React.useState(0);
  const src = candidates[urlIndex] ?? candidates[0] ?? "";

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const blurRef = React.useRef<HTMLVideoElement>(null);
  const label = `${avatar.firstName} Vantage — ${avatar.role} preview`;

  const bumpSrc = React.useCallback(() => {
    setUrlIndex((i) => {
      if (i + 1 < candidates.length) return i + 1;
      return i;
    });
  }, [candidates.length]);

  React.useEffect(() => {
    setUrlIndex(0);
  }, [avatar.id]);

  React.useEffect(() => {
    const v = videoRef.current;
    const b = blurRef.current;
    if (v) {
      v.loop = true;
      v.playsInline = true;
      void v.play().catch(() => {});
    }
    if (b) {
      b.loop = true;
      b.playsInline = true;
      b.muted = true;
      void b.play().catch(() => {});
    }
  }, [src]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !audioActive;
    if (audioActive) {
      void v.play().catch(() => {});
    }
  }, [audioActive]);

  const syncBlur = React.useCallback(() => {
    const v = videoRef.current;
    const b = blurRef.current;
    if (!v || !b) return;
    if (Math.abs(b.currentTime - v.currentTime) > 0.12) {
      try {
        b.currentTime = v.currentTime;
      } catch {
        /* ignore */
      }
    }
  }, []);

  const onVolumeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleAudio();
  };

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-white/10 bg-neutral-950/75 text-neutral-100 shadow-none transition-[border-color,box-shadow] duration-200",
        audioActive && "border-white/22 ring-1 ring-white/15",
      )}
    >
      <div
        className="px-4 pt-4 sm:px-5 sm:pt-5"
        style={{ perspective: "1100px" }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div
          className="mx-auto w-full max-w-[240px] origin-center transform-3d transition-transform duration-200 ease-out will-change-transform sm:max-w-[260px]"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          }}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/15 bg-neutral-950 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.85)]",
            )}
          >
            <button
              type="button"
              onClick={onVolumeClick}
              className="absolute right-2 top-2 z-20 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-neutral-300 backdrop-blur-sm transition hover:border-white/35 hover:text-white"
              aria-label={
                audioActive
                  ? "Mute audio for this employee"
                  : "Unmute to hear this employee"
              }
              aria-pressed={audioActive}
              title={
                audioActive
                  ? "Sound on. Click to mute."
                  : "Sound off. Click to hear voice."
              }
            >
              {audioActive ? (
                <Volume2 className="size-4" aria-hidden />
              ) : (
                <VolumeX className="size-4" aria-hidden />
              )}
            </button>
            <div className="relative aspect-9/16 w-full overflow-hidden bg-black">
              <div className="absolute inset-0 z-0" aria-hidden>
                <video
                  key={`blur-${src}`}
                  ref={blurRef}
                  src={src}
                  className="pointer-events-none h-full min-h-full w-full min-w-full scale-125 object-cover opacity-45 blur-3xl"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  tabIndex={-1}
                />
              </div>
              <video
                key={`main-${src}`}
                ref={videoRef}
                src={src}
                className="relative z-10 h-full w-full object-cover object-center"
                onTimeUpdate={syncBlur}
                onError={bumpSrc}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={label}
              />
            </div>
          </div>
        </div>
      </div>

      <CardHeader className="flex-1 pb-4 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            {avatar.role}
          </span>
          {audioActive ? (
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400/90">
              Audio on
            </span>
          ) : null}
        </div>
        <CardTitle className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {avatar.firstName}{" "}
          <span className="text-neutral-500">Vantage</span>
        </CardTitle>
        <CardDescription className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-[15px]">
          {avatar.body}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function LandingUseCaseAvatarPanels() {
  /** At most one card unmuted at a time. */
  const [audioCardId, setAudioCardId] = React.useState<string | null>(null);
  const [tilt, setTilt] = React.useState<Record<string, { rx: number; ry: number }>>(
    {},
  );

  const toggleAudio = (id: string) => {
    setAudioCardId((current) => (current === id ? null : id));
  };

  const onMove = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt((prev) => ({
      ...prev,
      [id]: { rx: py * -8, ry: px * 8 },
    }));
  };

  const onLeave = (id: string) => {
    setTilt((prev) => ({ ...prev, [id]: { rx: 0, ry: 0 } }));
  };

  return (
    <>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3 xl:gap-8">
        {USE_CASE_AVATARS.map((avatar) => (
          <UseCaseAvatarCard
            key={avatar.id}
            avatar={avatar}
            audioActive={audioCardId === avatar.id}
            onToggleAudio={() => toggleAudio(avatar.id)}
            tilt={tilt[avatar.id] ?? { rx: 0, ry: 0 }}
            onPointerMove={(e) => onMove(avatar.id, e)}
            onPointerLeave={() => onLeave(avatar.id)}
          />
        ))}
      </div>
      <p className="mt-10 max-w-2xl text-pretty text-center text-xs leading-relaxed text-neutral-600 sm:mx-auto sm:text-left">
        Each preview has a speaker control to turn that employee&apos;s voice on
        or off. Only one card plays sound at a time so you can compare lanes
        without overlap.
      </p>
    </>
  );
}
