"use client";

import * as React from "react";
import OpenAI from "openai";
import { OpenAIRealtimeWebSocket } from "openai/realtime/websocket";
import type { RealtimeServerEvent } from "openai/resources/realtime/realtime";

import type {
  InteractionMessage,
  VoiceUiState,
} from "@/components/employee-interaction/types";

function int16PcmToBase64(samples: Int16Array): string {
  const u8 = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
  let binary = "";
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]!);
  return btoa(binary);
}

function decodePcm16Base64(b64: string): Int16Array {
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return new Int16Array(buf);
}

/** Resample to 24 kHz mono int16 for Realtime `audio/pcm`. */
function floatToPcm24kMono(input: AudioBuffer): Int16Array {
  const inRate = input.sampleRate;
  const ratio = inRate / 24000;
  const outLen = Math.floor(input.length / ratio);
  const out = new Int16Array(outLen);
  const ch0 = input.getChannelData(0);
  const ch1 = input.numberOfChannels > 1 ? input.getChannelData(1) : null;
  for (let i = 0; i < outLen; i++) {
    const srcIdx = Math.min(input.length - 1, Math.floor(i * ratio));
    let s = ch0[srcIdx] ?? 0;
    if (ch1) s = (s + (ch1[srcIdx] ?? 0)) * 0.5;
    s = Math.max(-1, Math.min(1, s));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

type Args = {
  employeeId: string;
  enabled: boolean;
  openAiChatEnabled: boolean;
  newId: () => string;
  appendTranscriptMessage: (m: InteractionMessage) => void;
  patchTranscriptMessage: (
    id: string,
    patch: Partial<Pick<InteractionMessage, "content">>,
  ) => void;
  maybeAutonameFromUserText: (text: string) => void;
};

export function useEmployeeRealtimeVoice({
  employeeId,
  enabled,
  openAiChatEnabled,
  newId,
  appendTranscriptMessage,
  patchTranscriptMessage,
  maybeAutonameFromUserText,
}: Args) {
  const [voiceState, setVoiceState] = React.useState<VoiceUiState>("idle");
  const [voiceError, setVoiceError] = React.useState<string | null>(null);

  const rtRef = React.useRef<OpenAIRealtimeWebSocket | null>(null);
  const modelRef = React.useRef<string>("gpt-realtime-1.5");
  const voiceModeRef = React.useRef<"push" | "vad">("push");
  const micLiveRef = React.useRef(false);
  const [turnMode, setTurnMode] = React.useState<"push" | "vad">("push");
  const userInputTranscriptBufRef = React.useRef("");
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const processorRef = React.useRef<ScriptProcessorNode | null>(null);
  const micMuteGainRef = React.useRef<GainNode | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const nextPlayTimeRef = React.useRef(0);
  const pendingUserMsgIdRef = React.useRef<string | null>(null);
  const assistantTextBufRef = React.useRef("");
  const waitingResponseRef = React.useRef(false);

  const argsRef = React.useRef({
    appendTranscriptMessage,
    patchTranscriptMessage,
    maybeAutonameFromUserText,
    newId,
    openAiChatEnabled,
  });
  argsRef.current = {
    appendTranscriptMessage,
    patchTranscriptMessage,
    maybeAutonameFromUserText,
    newId,
    openAiChatEnabled,
  };

  const clearVoiceError = React.useCallback(() => setVoiceError(null), []);

  const stopMicPipeline = React.useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    micMuteGainRef.current?.disconnect();
    micMuteGainRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    for (const t of mediaStreamRef.current?.getTracks() ?? []) t.stop();
    mediaStreamRef.current = null;
    micLiveRef.current = false;
  }, []);

  const teardownRealtime = React.useCallback(() => {
    stopMicPipeline();
    try {
      rtRef.current?.close();
    } catch {
      /* ignore */
    }
    rtRef.current = null;
    waitingResponseRef.current = false;
    pendingUserMsgIdRef.current = null;
    assistantTextBufRef.current = "";
    userInputTranscriptBufRef.current = "";
    nextPlayTimeRef.current = 0;
  }, [stopMicPipeline]);

  React.useEffect(() => {
    if (enabled) return;
    teardownRealtime();
    setVoiceState("idle");
  }, [enabled, teardownRealtime]);

  React.useEffect(() => () => teardownRealtime(), [teardownRealtime]);

  const ensureAudioContext = React.useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const Ctor =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (
            window as unknown as {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext
        : null;
    if (!Ctor) throw new Error("AudioContext is not available");
    const ctx = new Ctor();
    audioCtxRef.current = ctx;
    return ctx;
  }, []);

  const schedulePcmPlayback = React.useCallback((pcm: Int16Array) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    void ctx.resume();
    const ch = ctx.createBuffer(1, pcm.length, 24000);
    const data = ch.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i]! / 32768;
    let t = nextPlayTimeRef.current;
    if (t < ctx.currentTime) t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = ch;
    src.connect(ctx.destination);
    src.start(t);
    nextPlayTimeRef.current = t + ch.duration;
  }, []);

  const attachServerListener = React.useCallback(
    (rt: OpenAIRealtimeWebSocket) => {
      rt.on("event", (ev: RealtimeServerEvent) => {
        switch (ev.type) {
          case "response.output_audio.delta": {
            try {
              const pcm = decodePcm16Base64(ev.delta);
              schedulePcmPlayback(pcm);
            } catch {
              /* ignore bad chunk */
            }
            break;
          }
          case "response.output_audio_transcript.delta": {
            assistantTextBufRef.current += ev.delta;
            break;
          }
          case "response.output_audio_transcript.done": {
            assistantTextBufRef.current = ev.transcript || assistantTextBufRef.current;
            break;
          }
          case "conversation.item.input_audio_transcription.delta": {
            const id = pendingUserMsgIdRef.current;
            const piece = typeof ev.delta === "string" ? ev.delta : "";
            if (!id || !piece) break;
            userInputTranscriptBufRef.current += piece;
            argsRef.current.patchTranscriptMessage(id, {
              content: userInputTranscriptBufRef.current.trim() || "…",
            });
            break;
          }
          case "conversation.item.input_audio_transcription.completed": {
            const finalText =
              typeof ev.transcript === "string" ? ev.transcript.trim() : "";
            userInputTranscriptBufRef.current = "";
            const id = pendingUserMsgIdRef.current;
            if (id) {
              argsRef.current.patchTranscriptMessage(id, {
                content: finalText || "…",
              });
              if (argsRef.current.openAiChatEnabled && finalText) {
                argsRef.current.maybeAutonameFromUserText(finalText);
              }
              pendingUserMsgIdRef.current = null;
            } else if (voiceModeRef.current === "vad" && finalText) {
              argsRef.current.appendTranscriptMessage({
                id: argsRef.current.newId(),
                role: "user",
                content: finalText,
                createdAt: Date.now(),
              });
              if (argsRef.current.openAiChatEnabled) {
                argsRef.current.maybeAutonameFromUserText(finalText);
              }
            }
            break;
          }
          case "conversation.item.input_audio_transcription.failed": {
            const id = pendingUserMsgIdRef.current;
            const reason =
              ev.error?.message?.trim() || "Transcription failed";
            if (id) {
              argsRef.current.patchTranscriptMessage(id, {
                content: `(${reason})`,
              });
              pendingUserMsgIdRef.current = null;
            }
            userInputTranscriptBufRef.current = "";
            break;
          }
          case "response.done": {
            waitingResponseRef.current = false;
            const text = assistantTextBufRef.current.trim();
            assistantTextBufRef.current = "";
            if (text) {
              argsRef.current.appendTranscriptMessage({
                id: argsRef.current.newId(),
                role: "assistant",
                content: text,
                createdAt: Date.now(),
                status: "complete",
              });
            } else if (ev.response.status && ev.response.status !== "completed") {
              setVoiceError("Voice reply did not complete. Try again.");
            }
            if (voiceModeRef.current === "vad" && micLiveRef.current) {
              setVoiceState("recording");
            } else {
              setVoiceState("idle");
            }
            break;
          }
          case "error": {
            setVoiceError(ev.error.message || "Realtime error");
            waitingResponseRef.current = false;
            setVoiceState("idle");
            stopMicPipeline();
            break;
          }
          default:
            break;
        }
      });

      rt.on("error", (err) => {
        setVoiceError(err.message);
        waitingResponseRef.current = false;
        setVoiceState("idle");
        stopMicPipeline();
      });
    },
    [schedulePcmPlayback, stopMicPipeline],
  );

  const connectRealtime = React.useCallback(async () => {
    if (rtRef.current) return rtRef.current;
    const res = await fetch("/api/employees/realtime-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
    });
    const data = (await res.json()) as {
      model?: string;
      clientSecret?: string;
      voiceMode?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || `Session failed (${res.status})`);
    }
    if (!data.clientSecret || !data.model) {
      throw new Error("Invalid realtime session response");
    }
    const mode: "push" | "vad" =
      data.voiceMode === "vad" ? "vad" : "push";
    voiceModeRef.current = mode;
    setTurnMode(mode);
    modelRef.current = data.model;
    const client = new OpenAI({
      apiKey: data.clientSecret,
      dangerouslyAllowBrowser: true,
    });
    const rt = new OpenAIRealtimeWebSocket({ model: data.model }, client);
    rtRef.current = rt;
    attachServerListener(rt);
    await new Promise<void>((resolve, reject) => {
      const t = window.setTimeout(() => reject(new Error("Realtime connect timeout")), 15000);
      rt.socket.addEventListener(
        "open",
        () => {
          clearTimeout(t);
          resolve();
        },
        { once: true },
      );
      rt.socket.addEventListener(
        "error",
        () => {
          clearTimeout(t);
          reject(new Error("WebSocket error"));
        },
        { once: true },
      );
    });
    return rt;
  }, [attachServerListener, employeeId]);

  const startRecording = React.useCallback(async () => {
    if (!enabled) return;
    setVoiceError(null);
    setVoiceState("processing");
    try {
      ensureAudioContext();
      const ctx = audioCtxRef.current!;
      if (ctx.state === "suspended") await ctx.resume();

      const rt = await connectRealtime();
      rt.send({ type: "input_audio_buffer.clear" });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (e) => {
        const inputBuf = e.inputBuffer;
        const pcm = floatToPcm24kMono(inputBuf);
        if (pcm.length === 0) return;
        rt.send({
          type: "input_audio_buffer.append",
          audio: int16PcmToBase64(pcm),
        });
      };
      source.connect(processor);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      micMuteGainRef.current = mute;
      processor.connect(mute);
      mute.connect(ctx.destination);

      setVoiceState("recording");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setVoiceError(msg);
      setVoiceState("idle");
      stopMicPipeline();
      try {
        rtRef.current?.close();
      } catch {
        /* ignore */
      }
      rtRef.current = null;
    }
  }, [connectRealtime, enabled, ensureAudioContext, stopMicPipeline]);

  const stopRecordingAndRespond = React.useCallback(() => {
    if (voiceModeRef.current !== "push") return;
    const rt = rtRef.current;
    stopMicPipeline();
    if (!rt) {
      setVoiceState("idle");
      return;
    }

    const uid = argsRef.current.newId();
    pendingUserMsgIdRef.current = uid;
    userInputTranscriptBufRef.current = "";
    assistantTextBufRef.current = "";
    argsRef.current.appendTranscriptMessage({
      id: uid,
      role: "user",
      content: "…",
      createdAt: Date.now(),
    });

    const ctx = audioCtxRef.current;
    const sendTurn = () => {
      nextPlayTimeRef.current = audioCtxRef.current?.currentTime ?? 0;
      waitingResponseRef.current = true;
      setVoiceState("processing");
      rt.send({ type: "input_audio_buffer.commit" });
      rt.send({
        type: "response.create",
        response: { output_modalities: ["audio"] },
      });
    };

    if (ctx) {
      void ctx.resume().then(sendTurn).catch(sendTurn);
    } else {
      sendTurn();
    }
  }, [stopMicPipeline]);

  const onVoicePress = React.useCallback(() => {
    if (!enabled) return;
    if (voiceState === "idle") {
      void startRecording();
      return;
    }
    if (voiceState === "recording") {
      if (voiceModeRef.current === "vad") {
        teardownRealtime();
        setVoiceState("idle");
        return;
      }
      stopRecordingAndRespond();
    }
  }, [
    enabled,
    voiceState,
    startRecording,
    stopRecordingAndRespond,
    teardownRealtime,
  ]);

  const voiceButtonLabels = React.useMemo(
    () =>
      turnMode === "push"
        ? {
            idle: "Tap — mic on (you choose when to stop)",
            recording: "Tap again when finished — then we send",
            processing: "Waiting for reply…",
          }
        : {
            idle: "Start hands-free (one tap for mic permission)",
            recording:
              "Speak anytime — pause to get a reply — tap square to end session",
            processing: "Assistant replying… speak to interrupt",
          },
    [turnMode],
  );

  if (!enabled) {
    return {
      voiceState: "idle" as const,
      voiceError: null,
      clearVoiceError,
      onVoicePress: () => {},
      realtimeVoiceActive: false,
      voiceButtonLabels: undefined,
    };
  }

  return {
    voiceState,
    voiceError,
    clearVoiceError,
    onVoicePress,
    realtimeVoiceActive: true,
    voiceButtonLabels,
  };
}
