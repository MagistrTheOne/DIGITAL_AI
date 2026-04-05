"use client";

import * as React from "react";

import { AvatarPreviewSection } from "@/components/employee-interaction/AvatarPreviewSection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getEmployeeAvatarPreviewStateAction } from "@/features/employees/actions";
import type { RenderStatus } from "@/features/employees/avatar-preview.types";
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
}: {
  roleLabel: string;
  name: string;
  avatarPlaceholder: string;
  prompt: string;
  capabilities: string[];
  draftEmployeeId: string | null;
  avatarPreviewGenerateEnabled: boolean;
}) {
  const dn = displayName(name);
  const initials = initialsFromDisplay(dn);

  const [snap, setSnap] = React.useState<{
    renderStatus: RenderStatus;
    videoUrl: string | null;
    jobId: string | null;
    error: string | null;
  }>({
    renderStatus: "idle",
    videoUrl: null,
    jobId: null,
    error: null,
  });

  React.useEffect(() => {
    if (!draftEmployeeId?.trim()) return;
    let cancelled = false;
    void (async () => {
      const r = await getEmployeeAvatarPreviewStateAction(draftEmployeeId.trim());
      if (cancelled || !r.ok) return;
      setSnap({
        renderStatus: r.renderStatus,
        videoUrl: r.videoUrl,
        jobId: r.jobId,
        error: r.error,
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
        videoUrl: r.videoUrl,
        jobId: r.jobId,
        error: r.error,
      });
    })();
  }, [draftEmployeeId]);

  const avatarPreviewVisible =
    avatarPreviewGenerateEnabled ||
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
              Avatar preview — generate before deploy or after from AI Digital.
            </p>
          </div>
        </div>

        {draftEmployeeId ? (
          <AvatarPreviewSection
            employeeId={draftEmployeeId}
            visible={avatarPreviewVisible}
            generateEnabled={avatarPreviewGenerateEnabled}
            initialRenderStatus={snap.renderStatus}
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
        {avatarPlaceholder.trim() ? (
          <p className="text-xs text-neutral-500">
            Video look: {avatarPlaceholder.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
