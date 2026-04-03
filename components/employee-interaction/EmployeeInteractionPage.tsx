"use client";

import * as React from "react";
import { flushSync } from "react-dom";

import { AnamAvatarPreview } from "@/components/employee-interaction/AnamAvatarPreview";
import { AvatarStage } from "@/components/employee-interaction/AvatarStage";
import { ChatInput } from "@/components/employee-interaction/ChatInput";
import { ChatMessages } from "@/components/employee-interaction/ChatMessages";
import { EmployeeHeader } from "@/components/employee-interaction/EmployeeHeader";
import type {
  InteractionMessage,
  VoiceUiState,
} from "@/components/employee-interaction/types";
import { VoiceControlButton } from "@/components/employee-interaction/VoiceControlButton";
import { Separator } from "@/components/ui/separator";
import type { ArachineXEvent } from "@/features/arachine-x/event-system/eventTypes";
import { useAvatarRuntime } from "@/features/arachine-x/client/useAvatarRuntime";
import { EmployeeOpenAiSessionsSidebar } from "@/components/employee-interaction/EmployeeOpenAiSessionsSidebar";
import { postEmployeeOpenAiChat } from "@/features/employees/openaiChat.client";
import { useEmployeeOpenAiSessions } from "@/features/employees/useEmployeeOpenAiSessions";
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
  anamPreviewEnabled,
  openAiChatEnabled,
}: {
  bootstrap: EmployeeSessionBootstrapDTO;
  displayName: string;
  roleLabel?: string;
  employeeId: string;
  anamPreviewEnabled?: boolean;
  /** Server: true when OPENAI_API_KEY is set — transcript uses OpenAI Responses API. */
  openAiChatEnabled: boolean;
}) {
  const avatarBootstrap = React.useMemo(() => toAvatarBootstrap(bootstrap), [bootstrap]);

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
    selectSession,
    newSession,
    renameSession,
    deleteSession,
    maybeAutonameFromUserText,
  } = useEmployeeOpenAiSessions(employeeId, openAiChatEnabled);

  const messages = openAiChatEnabled ? openAiMessages : wsMessages;
  const setTranscriptMessages = openAiChatEnabled
    ? setOpenAiMessages
    : setWsMessages;

  const [draft, setDraft] = React.useState("");
  const [pendingImageDataUrl, setPendingImageDataUrl] = React.useState<
    string | null
  >(null);
  const [voiceState, setVoiceState] = React.useState<VoiceUiState>("idle");
  const [transcriptBusy, setTranscriptBusy] = React.useState(false);

  const processingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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
    return subscribeEvents((ev: ArachineXEvent) => {
      if (ev.type !== "chat.message.received") return;
      if (ev.message.from !== "assistant") return;
      if (openAiChatEnabled) return;
      setWsMessages((prev) => {
        if (prev.some((m) => m.id === ev.message.id)) return prev;
        return [
          ...prev,
          {
            id: ev.message.id,
            role: "assistant",
            content: ev.message.text,
            createdAt: ev.at,
            status: "complete" as const,
          },
        ];
      });
    });
  }, [
    bootstrap.realtime.ok,
    bootstrap.sessionId,
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
        });
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
    openAiChatEnabled,
    pendingImageDataUrl,
    sendChat,
    setTranscriptMessages,
    transcriptBusy,
  ]);

  const onVoicePress = React.useCallback(() => {
    if (voiceState === "idle") {
      setVoiceState("recording");
      return;
    }
    if (voiceState === "recording") {
      setVoiceState("processing");
      if (processingTimer.current) clearTimeout(processingTimer.current);
      processingTimer.current = setTimeout(() => {
        setVoiceState("idle");
        processingTimer.current = null;
      }, 1600);
    }
  }, [voiceState]);

  const realtimeError =
    !bootstrap.realtime.ok
      ? bootstrap.realtime.error
      : avatarState.phase === "error"
        ? avatarState.lastError
        : null;

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col gap-0">
      <EmployeeHeader
        displayName={displayName}
        roleLabel={roleLabel}
        voiceState={voiceState}
      />

      {realtimeError ? (
        <div className="mx-6 mt-2 rounded-lg border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/90">
          Realtime: {realtimeError}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-6 pt-6 lg:flex-row lg:gap-0">
        <section className="flex shrink-0 flex-col items-center gap-8 lg:w-[42%] lg:max-w-xl lg:justify-center lg:border-r lg:border-neutral-800 lg:pr-8 lg:pt-4">
          {anamPreviewEnabled ? (
            <AnamAvatarPreview
              employeeId={employeeId}
              displayName={displayName}
            />
          ) : (
            <AvatarStage displayName={displayName} />
          )}
          {!anamPreviewEnabled && (
            <VoiceControlButton state={voiceState} onPress={onVoicePress} />
          )}
        </section>

        <Separator className="bg-neutral-800 lg:hidden" />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-neutral-800/80 bg-neutral-950/40 lg:flex-row lg:border-0 lg:bg-transparent">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="border-b border-neutral-800 px-3 py-2 lg:border-neutral-800">
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Transcript
              </h2>
              <p className="text-[11px] text-neutral-600">
                {openAiChatEnabled
                  ? "OpenAI · agent + tools + vision (server)"
                  : "ARACHNE-X · WebSocket (MVP)"}
                {" · "}
                phase{" "}
                <span className="font-mono text-neutral-500">
                  {avatarState.phase}
                </span>
              </p>
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
