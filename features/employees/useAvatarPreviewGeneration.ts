"use client";

import * as React from "react";

import type {
  AvatarRenderStage,
  RenderStatus,
} from "@/features/employees/avatar-preview.types";
import {
  createAvatarIdentityClip,
  generateAvatarPreview,
  isPreviewJobResponse,
  isPreviewVideoResponse,
  pollJobUntilTerminal,
} from "@/features/employees/avatar-preview-client";

function statusLabel(
  status: RenderStatus,
  busy: boolean,
  autoDigitalHuman: boolean,
): string {
  if (busy) return "Rendering…";
  switch (status) {
    case "generating":
      return autoDigitalHuman
        ? "Creating digital human…"
        : "Queued / rendering…";
    case "ready":
      return "Preview ready";
    case "failed":
      return "Generation failed";
    default:
      return "No preview yet";
  }
}

export function useAvatarPreviewGeneration(options: {
  employeeId: string;
  initialRenderStatus: RenderStatus;
  initialVideoUrl: string | null;
  initialJobId: string | null;
  initialError: string | null;
  onRefresh: () => void;
  /** When true and `identityClipImageUrl` is set, Generate uses InfiniteTalk one-shot (not ARACHNE preview). */
  identityClipEnabled?: boolean;
  identityClipImageUrl?: string | null;
  identityClipIntroText?: string;
  /** Poll server for NULLXES auto post-deploy pipeline (OpenAI → ElevenLabs → InfiniteTalk). */
  autoDigitalHumanEnabled?: boolean;
  initialRenderStage?: AvatarRenderStage | null;
}) {
  const {
    employeeId,
    initialRenderStatus,
    initialVideoUrl,
    initialJobId,
    initialError,
    onRefresh,
    identityClipEnabled = false,
    identityClipImageUrl = null,
    identityClipIntroText,
    autoDigitalHumanEnabled = false,
    initialRenderStage = null,
  } = options;

  const [renderStatus, setRenderStatus] = React.useState<RenderStatus>(
    initialRenderStatus,
  );
  const [renderStage, setRenderStage] = React.useState<AvatarRenderStage | null>(
    initialRenderStage,
  );
  const [videoUrl, setVideoUrl] = React.useState<string | null>(initialVideoUrl);
  const [jobId, setJobId] = React.useState<string | null>(initialJobId);
  const [error, setError] = React.useState<string | null>(initialError);
  const [busy, setBusy] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const onRefreshRef = React.useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  React.useEffect(() => {
    setRenderStatus(initialRenderStatus);
    setRenderStage(initialRenderStage);
    setVideoUrl(initialVideoUrl);
    setJobId(initialJobId);
    setError(initialError);
  }, [
    initialRenderStatus,
    initialRenderStage,
    initialVideoUrl,
    initialJobId,
    initialError,
    employeeId,
  ]);

  React.useEffect(() => {
    if (!autoDigitalHumanEnabled || renderStatus !== "generating") {
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/employees/${encodeURIComponent(employeeId)}/avatar-generation-status`,
        );
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as {
          status?: string;
          stage?: AvatarRenderStage | null;
          error?: string | null;
          videoUrl?: string | null;
        };
        if (body.stage === "face" || body.stage === "voice" || body.stage === "video") {
          setRenderStage(body.stage);
        } else if (body.status !== "generating") {
          setRenderStage(null);
        }
        if (body.status === "ready" && body.videoUrl?.trim()) {
          setVideoUrl(body.videoUrl.trim());
          setRenderStatus("ready");
          setError(null);
          setJobId(null);
          onRefreshRef.current();
          return;
        }
        if (body.status === "failed") {
          setRenderStatus("failed");
          setRenderStage(null);
          setError(body.error?.trim() || "Generation failed");
          onRefreshRef.current();
        }
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [autoDigitalHumanEnabled, renderStatus, employeeId]);

  const runPoll = React.useCallback(async (id: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setRenderStatus("generating");
    setError(null);

    const result = await pollJobUntilTerminal(id, {
      signal: ac.signal,
      onTick: (body) => {
        if (body.status === "generating") setRenderStatus("generating");
      },
    });

    if (result.status === "ready" && result.videoUrl) {
      setVideoUrl(result.videoUrl);
      setRenderStatus("ready");
      setJobId(null);
      setError(null);
      onRefreshRef.current();
      return;
    }

    setRenderStatus("failed");
    setError(result.error ?? "Generation failed");
    setJobId(null);
    onRefreshRef.current();
  }, []);

  React.useEffect(() => {
    if (initialRenderStatus !== "generating" || !initialJobId?.trim()) {
      return;
    }
    const j = initialJobId.trim();
    void runPoll(j);
    return () => {
      abortRef.current?.abort();
    };
  }, [employeeId, initialRenderStatus, initialJobId, runPoll]);

  const generate = React.useCallback(async () => {
    abortRef.current?.abort();
    setBusy(true);
    setError(null);
    setRenderStatus("generating");

    if (identityClipEnabled && identityClipImageUrl?.trim()) {
      const clip = await createAvatarIdentityClip(employeeId, {
        imageUrl: identityClipImageUrl.trim(),
        ...(identityClipIntroText?.trim()
          ? { text: identityClipIntroText.trim() }
          : {}),
      });
      if (!clip.ok) {
        setRenderStatus("failed");
        setError(clip.error);
        setBusy(false);
        onRefreshRef.current();
        return;
      }
      setVideoUrl(clip.body.videoUrl);
      setRenderStatus("ready");
      setJobId(null);
      setError(null);
      setBusy(false);
      onRefreshRef.current();
      return;
    }

    const res = await generateAvatarPreview(employeeId);
    if (!res.ok) {
      setRenderStatus("failed");
      setError(res.error);
      setBusy(false);
      onRefreshRef.current();
      return;
    }

    if (isPreviewVideoResponse(res.body)) {
      setVideoUrl(res.body.videoUrl);
      setRenderStatus("ready");
      setJobId(null);
      setBusy(false);
      onRefreshRef.current();
      return;
    }

    if (isPreviewJobResponse(res.body)) {
      setJobId(res.body.jobId);
      await runPoll(res.body.jobId);
      setBusy(false);
      return;
    }

    setRenderStatus("failed");
    setError("Unexpected preview response");
    setBusy(false);
    onRefreshRef.current();
  }, [
    employeeId,
    identityClipEnabled,
    identityClipImageUrl,
    identityClipIntroText,
    runPoll,
  ]);

  const retry = React.useCallback(async () => {
    if (autoDigitalHumanEnabled) {
      setError(null);
      setBusy(true);
      try {
        const res = await fetch(
          `/api/employees/${encodeURIComponent(employeeId)}/avatar-generation-retry`,
          { method: "POST" },
        );
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setRenderStatus("failed");
          setError(body.error?.trim() || "Retry failed");
          setBusy(false);
          onRefreshRef.current();
          return;
        }
        setRenderStatus("generating");
        setRenderStage(null);
        setVideoUrl(null);
        setJobId(null);
        setError(null);
        setBusy(false);
        onRefreshRef.current();
      } catch {
        setRenderStatus("failed");
        setError("Retry failed");
        setBusy(false);
      }
      return;
    }
    setError(null);
    void generate();
  }, [autoDigitalHumanEnabled, employeeId, generate]);

  React.useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  return {
    renderStatus,
    renderStage,
    videoUrl,
    jobId,
    error,
    busy,
    generate,
    retry,
    label: statusLabel(renderStatus, busy, autoDigitalHumanEnabled),
  };
}
