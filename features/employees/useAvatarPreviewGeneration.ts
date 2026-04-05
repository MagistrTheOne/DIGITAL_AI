"use client";

import * as React from "react";

import type { RenderStatus } from "@/features/employees/avatar-preview.types";
import {
  generateAvatarPreview,
  isPreviewJobResponse,
  isPreviewVideoResponse,
  pollJobUntilTerminal,
} from "@/features/employees/avatar-preview-client";

function statusLabel(status: RenderStatus, busy: boolean): string {
  if (busy) return "Rendering…";
  switch (status) {
    case "generating":
      return "Queued / rendering…";
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
}) {
  const {
    employeeId,
    initialRenderStatus,
    initialVideoUrl,
    initialJobId,
    initialError,
    onRefresh,
  } = options;

  const [renderStatus, setRenderStatus] = React.useState<RenderStatus>(
    initialRenderStatus,
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
    setVideoUrl(initialVideoUrl);
    setJobId(initialJobId);
    setError(initialError);
  }, [
    initialRenderStatus,
    initialVideoUrl,
    initialJobId,
    initialError,
    employeeId,
  ]);

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
  }, [employeeId, runPoll]);

  const retry = React.useCallback(() => {
    setError(null);
    void generate();
  }, [generate]);

  React.useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  return {
    renderStatus,
    videoUrl,
    jobId,
    error,
    busy,
    generate,
    retry,
    label: statusLabel(renderStatus, busy),
  };
}
