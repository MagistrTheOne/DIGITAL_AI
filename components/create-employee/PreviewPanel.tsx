"use client";

import * as React from "react";

import { AvatarPreviewSection } from "@/components/employee-interaction/AvatarPreviewSection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getEmployeeAvatarPreviewStateAction } from "@/features/employees/actions";
import type {
  AvatarRenderStage,
  RenderStatus,
} from "@/features/employees/avatar-preview.types";
import {
  normalizeAvatarLookDetailForStorage,
  resolvePortraitLookDetailForGeneration,
} from "@/lib/avatar/avatar-appearance-normalize";
import { cn } from "@/lib/utils";

function displayName(raw: string) {
  const t = raw.trim();
  if (!t) return "Agent Vantage";
  return t.toLowerCase().endsWith("vantage") ? t : `${t} Vantage`;
}

function initialsFromDisplay(display: string) {
  const parts = display.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return display.slice(0, 2).toUpperCase() || "?";
}

export function PreviewPanel({
  roleLabel,
  name,
  avatarPlaceholder,
  prompt,
  capabilities,
  draftEmployeeId,
  avatarPreviewGenerateEnabled,
  draftPortraitEnabled,
}: {
  roleLabel: string;
  name: string;
  avatarPlaceholder: string;
  prompt: string;
  capabilities: string[];
  draftEmployeeId: string | null;
  avatarPreviewGenerateEnabled: boolean;
  draftPortraitEnabled: boolean;
}) {
  const dn = displayName(name);
  const initials = initialsFromDisplay(dn);

  const [snap, setSnap] = React.useState<{
    renderStatus: RenderStatus;
    renderStage: AvatarRenderStage | null;
    videoUrl: string | null;
    jobId: string | null;
    error: string | null;
    identityImageUrl: string | null;
  }>({
    renderStatus: "idle",
    renderStage: null,
    videoUrl: null,
    jobId: null,
    error: null,
    identityImageUrl: null,
  });

  const [portraitBusy, setPortraitBusy] = React.useState(false);
  const [portraitError, setPortraitError] = React.useState<string | null>(null);

  const hasCustomLook = Boolean(
    normalizeAvatarLookDetailForStorage(avatarPlaceholder),
  );
  const lookDetail = resolvePortraitLookDetailForGeneration({
    rawPlaceholder: avatarPlaceholder,
    roleLabel,
    displayName: dn,
  });

  React.useEffect(() => {
    if (!draftEmployeeId?.trim()) return;
    let cancelled = false;
    void (async () => {
      const r = await getEmployeeAvatarPreviewStateAction(draftEmployeeId.trim());
      if (cancelled || !r.ok) return;
      setSnap({
        renderStatus: r.renderStatus,
        renderStage: r.renderStage,
        videoUrl: r.videoUrl,
        jobId: r.jobId,
        error: r.error,
        identityImageUrl: r.identityImageUrl,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [draftEmployeeId]);

  const onPreviewRefresh = React.useCallback(() => {
    if (!draftEmployeeId?.trim()) return;
    void (async () => {
      const r = await getEmployeeAvatarPreviewStateAction(draftEmployeeId.trim());
      if (!r.ok) return;
      setSnap({
        renderStatus: r.renderStatus,
        renderStage: r.renderStage,
        videoUrl: r.videoUrl,
        jobId: r.jobId,
        error: r.error,
        identityImageUrl: r.identityImageUrl,
      });
    })();
  }, [draftEmployeeId]);

  const generateDraftPortrait = React.useCallback(async () => {
    if (!draftEmployeeId?.trim() || !lookDetail) return;
    setPortraitBusy(true);
    setPortraitError(null);
    try {
      const res = await fetch(
        `/api/employees/${encodeURIComponent(draftEmployeeId.trim())}/draft-portrait`,
        { method: "POST" },
      );
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        imageUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.imageUrl?.trim()) {
        setPortraitError(body.error?.trim() || "Portrait generation failed");
        return;
      }
      onPreviewRefresh();
    } catch {
      setPortraitError("Portrait generation failed");
    } finally {
      setPortraitBusy(false);
    }
  }, [draftEmployeeId, onPreviewRefresh]);

  const portraitUrl = snap.identityImageUrl?.trim() || null;

  const avatarPreviewVisible =
    avatarPreviewGenerateEnabled ||
    draftPortraitEnabled ||
    snap.renderStatus === "generating" ||
    snap.renderStatus === "failed" ||
    Boolean(snap.videoUrl);

  return (
    <div className="space-y-3 rounded-xl border border-neutral-800/80 bg-neutral-900/30 p-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-neutral-100">Preview</h3>
        <p className="text-xs text-neutral-500">
          What you&apos;re about to deploy — confirm before activation.
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <Avatar className="size-14 shrink-0 border border-neutral-800">
            <AvatarFallback className="bg-neutral-800 text-sm font-medium text-neutral-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-2">
              <span className="text-sm font-medium text-neutral-200">{dn}</span>
              {roleLabel ? (
                <Badge variant="outline" className="w-fit border-neutral-700 text-neutral-300">
                  {roleLabel}
                </Badge>
              ) : (
                <span className="text-xs text-amber-500/90">Select a role</span>
              )}
            </div>
            <p className="text-[11px] leading-snug text-neutral-500">
              Generate a GPT Image portrait on this step when enabled; video
              preview uses ARACHNE or AI Digital after deploy.
            </p>
          </div>
        </div>

        {draftPortraitEnabled && draftEmployeeId ? (
          <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
            <div className="text-xs font-medium text-neutral-300">
              Portrait preview (GPT Image)
            </div>
            {portraitUrl ? (
              <figure className="mx-auto w-[min(100%,20rem)] shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-black/40 sm:mx-0">
                <img
                  src={portraitUrl}
                  alt="Generated portrait preview"
                  className="aspect-square h-auto w-full object-cover"
                />
              </figure>
            ) : (
              <p className="text-[11px] text-neutral-500">
                No portrait yet — same pipeline as auto digital human (OpenAI →
                Blob).{" "}
                {hasCustomLook
                  ? "Guided by your look text from step 1."
                  : "Guided by role and display name until you add a look in step 1."}
              </p>
            )}
            {portraitError ? (
              <p className="text-[11px] text-red-400/90" role="alert">
                {portraitError}
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-fit border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              disabled={portraitBusy}
              onClick={() => void generateDraftPortrait()}
            >
              {portraitBusy ? "Generating…" : "Generate portrait"}
            </Button>
            {!hasCustomLook ? (
              <p className="text-[10px] text-neutral-600">
                Optional: add a look in step 1 for finer control over the
                portrait.
              </p>
            ) : null}
          </div>
        ) : null}

        {draftEmployeeId ? (
          <AvatarPreviewSection
            employeeId={draftEmployeeId}
            visible={avatarPreviewVisible}
            generateEnabled={avatarPreviewGenerateEnabled}
            initialRenderStatus={snap.renderStatus}
            initialRenderStage={snap.renderStage}
            initialVideoUrl={snap.videoUrl}
            initialJobId={snap.jobId}
            initialError={snap.error}
            className="flex w-full max-w-md flex-col items-stretch gap-2"
            onRefreshOverride={onPreviewRefresh}
          />
        ) : null}

        <Separator className="bg-neutral-800/80" />

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Instructions
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-neutral-400">
            {prompt.trim() || "—"}
          </p>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Capabilities
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {capabilities.length === 0 ? (
              <span className="text-xs text-neutral-500">None selected</span>
            ) : (
              capabilities.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className={cn(
                    "border border-neutral-700 bg-neutral-900 px-2 py-0 text-[11px] text-neutral-300",
                  )}
                >
                  {c}
                </Badge>
              ))
            )}
          </div>
        </div>
        {hasCustomLook ? (
          <p className="text-xs text-neutral-500">
            Video look (saved):{" "}
            {normalizeAvatarLookDetailForStorage(avatarPlaceholder)}
          </p>
        ) : (
          <p className="text-xs text-neutral-500">
            No custom look in step 1 — portrait uses role and display name.
          </p>
        )}
      </div>
    </div>
  );
}
