"use client";

import * as React from "react";
import { flushSync } from "react-dom";

import { AvatarStage } from "@/components/employee-interaction/AvatarStage";
import { ChatInput } from "@/components/employee-interaction/ChatInput";
import { ChatMessages } from "@/components/employee-interaction/ChatMessages";
import { EmployeeHeader } from "@/components/employee-interaction/EmployeeHeader";
import type {
  InteractionMessage,
  VoiceUiState,
} from "@/components/employee-interaction/types";
import { AvatarPreviewSection } from "@/components/employee-interaction/AvatarPreviewSection";
import { VoiceControlButton } from "@/components/employee-interaction/VoiceControlButton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import type { ArachneXEvent } from "@/features/arachne-x/event-system/eventTypes";
import { useAvatarRuntime } from "@/features/arachne-x/client/useAvatarRuntime";
import { EmployeeOpenAiSessionsSidebar } from "@/components/employee-interaction/EmployeeOpenAiSessionsSidebar";
import { postArachneChatTurnTelemetry } from "@/features/employees/arachneTelemetry.client";
import { postEndAiWorkspaceSession } from "@/features/employees/analyticsSession.client";
import { postEmployeeOpenAiChat } from "@/features/employees/openaiChat.client";
import { useEmployeeOpenAiSessions } from "@/features/employees/useEmployeeOpenAiSessions";
import { useEmployeeRealtimeVoice } from "@/features/employees/useEmployeeRealtimeVoice";
import { deriveAvatarPresentationState } from "@/features/employees/avatar-digital-human.types";
import { useAvatarRenderPipeline } from "@/features/employees/useAvatarRenderPipeline";
import type { EmployeeSessionBootstrapDTO } from "@/features/employees/types";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toAvatarBootstrap(dto: EmployeeSessionBootstrapDTO) {
  return {
    sessionId: dto.sessionId,
    websocket: dto.websocket,
    capabilities: dto.capabilities,
  };
}

export function EmployeeInteractionPage({
  bootstrap,
  displayName,
  roleLabel,
  employeeId,
  openAiChatEnabled,
  realtimeVoiceEnabled,
  avatarPreviewGenerateEnabled = false,
  identityClipEnabled = false,
}: {
  bootstrap: EmployeeSessionBootstrapDTO;
  displayName: string;
  roleLabel?: string;
  employeeId: string;
  /** Server: true when OPENAI_API_KEY is set — transcript uses cloud Responses API (server-side). */
  openAiChatEnabled: boolean;
  /** Server: NULLXES_REALTIME_VOICE=1 + API key — push-to-talk uses Realtime (gpt-realtime-1.5 by default). */
  realtimeVoiceEnabled?: boolean;
  /** Server: ARACHNE_AVATAR_PREVIEW_URL set — show “Generate preview” (LongCat / worker on ARACHNE). */
  avatarPreviewGenerateEnabled?: boolean;
  /** Server: RunPod + ElevenLabs + Blob — InfiniteTalk one-shot identity when https reference image exists. */
  identityClipEnabled?: boolean;
}) {
  const identityClipImageUrl = bootstrap.employee.identityClipImageUrl ?? null;
  const avatarPreviewVisible =
    avatarPreviewGenerateEnabled ||
    (identityClipEnabled && Boolean(identityClipImageUrl?.trim())) ||
    bootstrap.employee.avatarPreview?.renderStatus === "generating" ||
    bootstrap.employee.avatarPreview?.renderStatus === "failed" ||
    Boolean(bootstrap.employee.videoPreview?.src);

  const avatarBootstrap = React.useMemo(() => toAvatarBootstrap(bootstrap), [bootstrap]);

  const avatarPipelineEnabled = Boolean(bootstrap.avatarRenderPipelineEnabled);
  const { notifyAssistantSegment, segmentOverlay, videoSegment } =
    useAvatarRenderPipeline({
      enabled: avatarPipelineEnabled,
      sessionId: bootstrap.sessionId,
      employeeId,
      hybridEnhance: Boolean(bootstrap.avatarRenderHybridDefault),
    });

  const {
    connect,
    disconnect,
    sendChat,
    subscribeEvents,
    state: avatarState,
  } = useAvatarRuntime(avatarBootstrap);

  const [wsMessages, setWsMessages] = React.useState<InteractionMessage[]>(() =>
    openAiChatEnabled
      ? []
      : [
          {
            id: newId(),
            role: "assistant",
            content:
              "This transcript is a live record of your conversation with the AI employee. Messages sync over ARACHNE-X WebSocket when realtime is available.",
            createdAt: Date.now(),
            ephemeral: true,
          },
        ],
  );

  const {
    hydrated: openAiHydrated,
    sessions: openAiSessionList,
    activeSessionId: openAiActiveSessionId,
    messages: openAiMessages,
    setMessages: setOpenAiMessages,
    selectSession: selectSessionInner,
    newSession: newSessionInner,
    renameSession,
    deleteSession: deleteSessionInner,
    maybeAutonameFromUserText,
  } = useEmployeeOpenAiSessions(employeeId, openAiChatEnabled);

  const selectSession = React.useCallback(
    (id: string) => {
      if (openAiActiveSessionId && openAiActiveSessionId !== id) {
        postEndAiWorkspaceSession(openAiActiveSessionId);
      }
      selectSessionInner(id);
    },
    [openAiActiveSessionId, selectSessionInner],
  );

  const newSession = React.useCallback(() => {
    if (openAiActiveSessionId) {
      postEndAiWorkspaceSession(openAiActiveSessionId);
    }
    newSessionInner();
  }, [openAiActiveSessionId, newSessionInner]);

  const deleteSession = React.useCallback(
    (id: string) => {
      postEndAiWorkspaceSession(id);
      deleteSessionInner(id);
    },
    [deleteSessionInner],
  );

  const messages = openAiChatEnabled ? openAiMessages : wsMessages;
  const setTranscriptMessages = openAiChatEnabled
    ? setOpenAiMessages
    : setWsMessages;

  const handleDeleteActiveChat = React.useCallback(() => {
    const id = openAiActiveSessionId;
    if (!id || !openAiHydrated) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this chat and its history?")
    ) {
      return;
    }
    deleteSession(id);
  }, [openAiActiveSessionId, openAiHydrated, deleteSession]);

  const clearWsTranscript = React.useCallback(() => {
    if (openAiChatEnabled) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Clear this transcript? Messages shown here will be removed.")
    ) {
      return;
    }
    setWsMessages([
      {
        id: newId(),
        role: "assistant",
        content:
          "This transcript is a live record of your conversation with the AI employee. Messages sync over ARACHNE-X WebSocket when realtime is available.",
        createdAt: Date.now(),
        ephemeral: true,
      },
    ]);
  }, [openAiChatEnabled]);

  const [draft, setDraft] = React.useState("");
  const [pendingImageDataUrl, setPendingImageDataUrl] = React.useState<
    string | null
  >(null);
  const [stubVoiceState, setStubVoiceState] = React.useState<VoiceUiState>("idle");
  const [transcriptBusy, setTranscriptBusy] = React.useState(false);

  const appendTranscriptMessage = React.useCallback(
    (m: InteractionMessage) => {
      setTranscriptMessages((prev) => [...prev, m]);
    },
    [setTranscriptMessages],
  );

  const patchTranscriptMessage = React.useCallback(
    (id: string, patch: Partial<Pick<InteractionMessage, "content">>) => {
      setTranscriptMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)),
      );
    },
    [setTranscriptMessages],
  );

  const voiceUiEnabled = Boolean(realtimeVoiceEnabled);
  const {
    voiceState: realtimeVoiceState,
    voiceError: realtimeVoiceError,
    clearVoiceError,
    onVoicePress: realtimeOnVoicePress,
    realtimeVoiceActive,
    voiceButtonLabels,
  } = useEmployeeRealtimeVoice({
    employeeId,
    enabled: voiceUiEnabled,
    openAiChatEnabled,
    newId,
    appendTranscriptMessage,
    patchTranscriptMessage,
    maybeAutonameFromUserText,
    onAssistantVoiceSegment: avatarPipelineEnabled
      ? ({ text }) => {
          notifyAssistantSegment(text);
        }
      : undefined,
  });

  const processingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  /** Start timestamps for ARACHNE user sends; paired with assistant replies / session errors. */
  const pendingWsTurnStartsRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    return () => {
      if (processingTimer.current) clearTimeout(processingTimer.current);
    };
  }, []);

  React.useEffect(() => {
    if (!bootstrap.realtime.ok) return;
    void connect().catch(() => {});
    return () => {
      void disconnect();
    };
  }, [bootstrap.realtime.ok, bootstrap.sessionId, connect, disconnect]);

  React.useEffect(() => {
    if (!bootstrap.realtime.ok) return;
    const clientSessionId = `nx_ws_${bootstrap.sessionId}`;
    return subscribeEvents((ev: ArachneXEvent) => {
      if (openAiChatEnabled) return;

      if (ev.type === "session.error") {
        const startedAt = pendingWsTurnStartsRef.current.shift();
        if (startedAt === undefined) return;
        const latencyMs = Math.max(0, Date.now() - startedAt);
        void postArachneChatTurnTelemetry({
          employeeId,
          clientSessionId,
          latencyMs,
          success: false,
          tokensDelta: 0,
        });
        return;
      }

      if (ev.type !== "chat.message.received") return;
      if (ev.message.from !== "assistant") return;

      setWsMessages((prev) => {
        if (prev.some((m) => m.id === ev.message.id)) return prev;
        const startedAt = pendingWsTurnStartsRef.current.shift();
        if (startedAt !== undefined) {
          const latencyMs = Math.max(0, Date.now() - startedAt);
          void postArachneChatTurnTelemetry({
            employeeId,
            clientSessionId,
            latencyMs,
            success: true,
            tokensDelta: 0,
          });
        }
        const next: InteractionMessage[] = [
          ...prev,
          {
            id: ev.message.id,
            role: "assistant" as const,
            content: ev.message.text,
            createdAt: ev.at,
            status: "complete" as const,
          },
        ];
        if (avatarPipelineEnabled && ev.message.text?.trim()) {
          const piece = ev.message.text;
          queueMicrotask(() => notifyAssistantSegment(piece));
        }
        return next;
      });
    });
  }, [
    avatarPipelineEnabled,
    bootstrap.realtime.ok,
    bootstrap.sessionId,
    employeeId,
    notifyAssistantSegment,
    openAiChatEnabled,
    subscribeEvents,
  ]);

  const chatInputEnabled = openAiChatEnabled || bootstrap.realtime.ok;

  const sendMessage = React.useCallback(async () => {
    const text = draft.trim();
    const image = pendingImageDataUrl;
    if ((!text && !image) || transcriptBusy) return;
    if (!chatInputEnabled) return;

    setDraft("");
    setPendingImageDataUrl(null);
    const userMsg: InteractionMessage = {
      id: newId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
      ...(image ? { imageUrls: [image] } : {}),
    };

    if (openAiChatEnabled) {
      let thread: InteractionMessage[] = [];
      flushSync(() => {
        setTranscriptMessages((prev) => {
          thread = [...prev, userMsg];
          return thread;
        });
      });
      if (text.trim()) {
        maybeAutonameFromUserText(text);
      }
      setTranscriptBusy(true);
      try {
        const transcript = thread
          .filter((m) => !m.ephemeral)
          .map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.role === "user" && m.imageUrls?.length
              ? { images: m.imageUrls }
              : {}),
          }));
        const { content } = await postEmployeeOpenAiChat({
          employeeId,
          messages: transcript,
          clientChatSessionId: openAiActiveSessionId ?? undefined,
        });
        if (avatarPipelineEnabled && content.trim()) {
          notifyAssistantSegment(content);
        }
        setTranscriptMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content,
            createdAt: Date.now(),
            status: "complete" as const,
          },
        ]);
      } catch (e) {
        const detail = e instanceof Error ? e.message : "Unknown error";
        setTranscriptMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: `Couldn’t get a reply. ${detail}`,
            createdAt: Date.now(),
            status: "complete" as const,
          },
        ]);
      } finally {
        setTranscriptBusy(false);
      }
      return;
    }

    setTranscriptMessages((prev) => [...prev, userMsg]);
    pendingWsTurnStartsRef.current.push(Date.now());
    setTranscriptBusy(true);
    try {
      sendChat(text);
    } finally {
      setTranscriptBusy(false);
    }
  }, [
    chatInputEnabled,
    draft,
    employeeId,
    maybeAutonameFromUserText,
    openAiActiveSessionId,
    openAiChatEnabled,
    pendingImageDataUrl,
    sendChat,
    setTranscriptMessages,
    transcriptBusy,
    avatarPipelineEnabled,
    notifyAssistantSegment,
  ]);

  const stubOnVoicePress = React.useCallback(() => {
    if (stubVoiceState === "idle") {
      setStubVoiceState("recording");
      return;
    }
    if (stubVoiceState === "recording") {
      setStubVoiceState("processing");
      if (processingTimer.current) clearTimeout(processingTimer.current);
      processingTimer.current = setTimeout(() => {
        setStubVoiceState("idle");
        processingTimer.current = null;
      }, 1600);
    }
  }, [stubVoiceState]);

  const voiceState = realtimeVoiceActive ? realtimeVoiceState : stubVoiceState;
  const onVoicePress = realtimeVoiceActive ? realtimeOnVoicePress : stubOnVoicePress;

  const stageVideoPreview = React.useMemo(() => {
    const fromArachne =
      bootstrap.realtime.ok &&
      bootstrap.arachneAvatar?.videoPreviewUrl?.trim();
    if (fromArachne) {
      return { src: fromArachne, type: "video/mp4" as const };
    }
    return bootstrap.employee.videoPreview;
  }, [
    bootstrap.realtime.ok,
    bootstrap.arachneAvatar?.videoPreviewUrl,
    bootstrap.employee.videoPreview,
  ]);

  const digitalHumanState = React.useMemo(
    () =>
      deriveAvatarPresentationState({
        voiceState,
        pipelineEnabled: avatarPipelineEnabled,
        videoSegment,
      }),
    [voiceState, avatarPipelineEnabled, videoSegment],
  );

  const realtimeError =
    !bootstrap.realtime.ok
      ? bootstrap.realtime.error
      : avatarState.phase === "error"
        ? avatarState.lastError
        : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
      <EmployeeHeader
        displayName={displayName}
        roleLabel={roleLabel}
        voiceState={voiceState}
      />

      {realtimeVoiceError ? (
        <div className="mx-6 mt-2 rounded-lg border border-red-900/50 bg-red-950/25 px-3 py-2 text-xs text-red-200/90">
          <span className="text-red-300/90">Voice: </span>
          {realtimeVoiceError}
          <button
            type="button"
            onClick={clearVoiceError}
            className="ml-2 underline decoration-red-400/50 hover:decoration-red-300"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {realtimeError ? (
        <div className="mx-6 mt-2 rounded-lg border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/90">
          Realtime: {realtimeError}
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden pt-6 lg:flex-row lg:gap-0">
        <section className="flex shrink-0 flex-col items-center gap-8 lg:min-h-0 lg:w-[42%] lg:max-w-xl lg:justify-center lg:overflow-y-auto lg:border-r lg:border-neutral-800 lg:pr-8 lg:pt-4">
          <AvatarStage
            displayName={displayName}
            videoPreview={stageVideoPreview}
            arachneStreamEnabled={bootstrap.realtime.ok}
            subscribeArachne={
              bootstrap.realtime.ok ? subscribeEvents : undefined
            }
            segmentOverlay={avatarPipelineEnabled ? segmentOverlay : null}
            digitalHumanState={
              avatarPipelineEnabled || realtimeVoiceActive
                ? digitalHumanState
                : undefined
            }
          />
          <AvatarPreviewSection
            employeeId={employeeId}
            visible={avatarPreviewVisible}
            generateEnabled={avatarPreviewGenerateEnabled}
            identityClipEnabled={identityClipEnabled}
            identityClipImageUrl={identityClipImageUrl}
            initialRenderStatus={
              bootstrap.employee.avatarPreview?.renderStatus ?? "idle"
            }
            initialVideoUrl={bootstrap.employee.videoPreview?.src ?? null}
            initialJobId={bootstrap.employee.avatarPreview?.jobId ?? null}
            initialError={bootstrap.employee.avatarPreview?.error ?? null}
          />
          <VoiceControlButton
            state={voiceState}
            onPress={onVoicePress}
            labels={realtimeVoiceActive ? voiceButtonLabels : undefined}
          />
        </section>

        <Separator className="bg-neutral-800 lg:hidden" />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/40 lg:flex-row lg:border-0 lg:bg-transparent">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-neutral-800 px-3 py-2 lg:border-neutral-800">
              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Transcript
                </h2>
                <p className="text-[11px] text-neutral-600">
                  {openAiChatEnabled
                    ? realtimeVoiceEnabled
                      ? "NULLXES transcript · cloud · tools + vision ·  Realtime voice"
                      : "NULLXES transcript · ARACHNE-X cloud · tools + vision (server)"
                    : "ARACHNE-X · WebSocket (MVP)"}
                  {" · "}
                  phase{" "}
                  <span className="font-mono text-neutral-500">
                    {avatarState.phase}
                  </span>
                  {bootstrap.arachneAvatar?.pipelineMode ? (
                    <>
                      {" · "}
                      <span className="font-mono text-neutral-500">
                        {bootstrap.arachneAvatar.pipelineMode}
                      </span>
                    </>
                  ) : null}
                  {bootstrap.arachneAvatar?.audioTransport ? (
                    <>
                      {" · audio "}
                      <span className="font-mono text-neutral-500">
                        {bootstrap.arachneAvatar.audioTransport}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              {openAiChatEnabled && openAiHydrated ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Delete this chat"
                  aria-label="Delete this chat"
                  className="h-8 shrink-0 gap-1.5 border-neutral-700 bg-neutral-900/80 px-2 text-xs text-neutral-200 hover:bg-neutral-800 hover:text-neutral-50"
                  onClick={handleDeleteActiveChat}
                  disabled={!openAiActiveSessionId}
                >
                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">Delete</span>
                </Button>
              ) : !openAiChatEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Clear transcript"
                  aria-label="Clear transcript"
                  className="h-8 shrink-0 gap-1.5 border-neutral-700 bg-neutral-900/80 px-2 text-xs text-neutral-200 hover:bg-neutral-800 hover:text-neutral-50"
                  onClick={clearWsTranscript}
                >
                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">Clear</span>
                </Button>
              ) : null}
            </div>
            <ChatMessages
              messages={messages}
              busy={transcriptBusy}
              hideEmptyPlaceholder={openAiChatEnabled}
            />
            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={() => void sendMessage()}
              disabled={transcriptBusy || !chatInputEnabled}
              visionEnabled={openAiChatEnabled}
              attachmentDataUrl={pendingImageDataUrl}
              onAttachmentChange={setPendingImageDataUrl}
            />
          </div>
          {openAiChatEnabled && openAiHydrated ? (
            <EmployeeOpenAiSessionsSidebar
              sessions={openAiSessionList}
              activeSessionId={openAiActiveSessionId}
              onSelect={selectSession}
              onNew={newSession}
              onRename={renameSession}
              onDelete={deleteSession}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
