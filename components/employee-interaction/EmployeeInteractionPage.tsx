"use client";

import * as React from "react";

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

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function EmployeeInteractionPage({
  displayName,
  roleLabel,
  employeeId,
  anamPreviewEnabled,
}: {
  displayName: string;
  roleLabel?: string;
  employeeId: string;
  anamPreviewEnabled?: boolean;
}) {
  const [messages, setMessages] = React.useState<InteractionMessage[]>(() => [
    {
      id: newId(),
      role: "assistant",
      content:
        "I'm your digital employee — chat and voice will stream here once the runtime is connected. For now this is a local preview.",
      createdAt: Date.now(),
    },
  ]);
  const [draft, setDraft] = React.useState("");
  const [voiceState, setVoiceState] = React.useState<VoiceUiState>("idle");

  const processingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    return () => {
      if (processingTimer.current) clearTimeout(processingTimer.current);
    };
  }, []);

  const sendMessage = React.useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "user", content: text, createdAt: Date.now() },
    ]);
  }, [draft]);

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

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col gap-0">
      <EmployeeHeader
        displayName={displayName}
        roleLabel={roleLabel}
        voiceState={voiceState}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-6 pt-6 lg:flex-row lg:gap-0">
        {/* Character + voice — future: video + duplex audio */}
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

        {/* Conversation surface — future: streaming tokens */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-neutral-800/80 bg-neutral-950/40 lg:border-0 lg:bg-transparent">
          <div className="border-b border-neutral-800 px-3 py-2 lg:border-neutral-800">
            <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Session
            </h2>
            <p className="text-[11px] text-neutral-600">
              Prepared for WebSocket + SSE streaming
            </p>
          </div>
          <ChatMessages messages={messages} />
          <ChatInput value={draft} onChange={setDraft} onSend={sendMessage} />
        </section>
      </div>
    </div>
  );
}
