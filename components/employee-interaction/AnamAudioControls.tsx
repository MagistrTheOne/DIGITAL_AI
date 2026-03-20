"use client";

import * as React from "react";

import type { AnamClient } from "@anam-ai/js-sdk";

const LS_MIC = "dai_saas.anam.micDeviceId";
const LS_SINK = "dai_saas.anam.sinkDeviceId";
const LS_VOL = "dai_saas.anam.outputVolume";

type Props = {
  status: "loading" | "live" | "error" | "stopped";
  videoRef: React.RefObject<HTMLVideoElement | null>;
  clientRef: React.RefObject<AnamClient | null>;
};

function readLs(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

/** Mic / speakers / volume for Anam WebRTC preview (browser APIs + @anam-ai/js-sdk). */
export function AnamAudioControls({ status, videoRef, clientRef }: Props) {
  const [inputs, setInputs] = React.useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = React.useState<MediaDeviceInfo[]>([]);
  const [sinkSupported, setSinkSupported] = React.useState(false);
  const [micChoice, setMicChoice] = React.useState(readLs(LS_MIC));
  const [sinkChoice, setSinkChoice] = React.useState(readLs(LS_SINK));
  const [volume, setVolume] = React.useState(() => {
    const v = Number.parseFloat(readLs(LS_VOL) || "1");
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1;
  });
  const [permNote, setPermNote] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSinkSupported(
      typeof HTMLMediaElement !== "undefined" &&
        "setSinkId" in HTMLMediaElement.prototype,
    );
  }, []);

  const refreshDevices = React.useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setPermNote("mediaDevices API unavailable (use HTTPS / localhost).");
      return;
    }
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const ins = all.filter((d) => d.kind === "audioinput");
      const outs = all.filter((d) => d.kind === "audiooutput");
      setInputs(ins);
      setOutputs(outs);
      const hasLabels = ins.some((d) => d.label) || outs.some((d) => d.label);
      if (!hasLabels && ins.length + outs.length > 0) {
        setPermNote(
          "Device names hidden until mic permission is granted (session usually unlocks this).",
        );
      } else {
        setPermNote(null);
      }
    } catch {
      setPermNote("Could not enumerate audio devices.");
    }
  }, []);

  React.useEffect(() => {
    if (status !== "live") return;
    void refreshDevices();
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const onChange = () => void refreshDevices();
    md.addEventListener("devicechange", onChange);
    return () => md.removeEventListener("devicechange", onChange);
  }, [status, refreshDevices]);

  // Apply output volume to <video>
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || status !== "live") return;
    v.volume = volume;
  }, [status, volume, videoRef]);

  // Apply output device (Chrome / Edge; Firefox often unsupported)
  React.useEffect(() => {
    if (status !== "live" || !sinkSupported || !sinkChoice) return;
    const el = videoRef.current;
    if (!el) return;
    void el.setSinkId(sinkChoice).catch(() => {
      setPermNote((prev) =>
        prev ?? "Output device change failed (try a user click or another browser).",
      );
    });
  }, [status, sinkSupported, sinkChoice, videoRef, outputs]);

  const onMicChange = React.useCallback(
    (deviceId: string) => {
      setMicChoice(deviceId);
      localStorage.setItem(LS_MIC, deviceId);
      const c = clientRef.current;
      if (c && status === "live") {
        void c.changeAudioInputDevice(deviceId).catch(() => {
          setPermNote("Could not switch microphone (try again after the stream is stable).");
        });
      }
    },
    [clientRef, status],
  );

  const onSinkChange = React.useCallback((deviceId: string) => {
    setSinkChoice(deviceId);
    localStorage.setItem(LS_SINK, deviceId);
    const el = videoRef.current;
    if (el && "setSinkId" in HTMLMediaElement.prototype) {
      void el.setSinkId(deviceId).catch(() => undefined);
    }
  }, [videoRef]);

  const onVolumeChange = React.useCallback((next: number) => {
    const v = Math.min(1, Math.max(0, next));
    setVolume(v);
    localStorage.setItem(LS_VOL, String(v));
    const el = videoRef.current;
    if (el) el.volume = v;
  }, [videoRef]);

  React.useEffect(() => {
    if (inputs.length === 0) return;
    setMicChoice((prev) => {
      if (prev && inputs.some((i) => i.deviceId === prev)) return prev;
      const saved = readLs(LS_MIC);
      if (saved && inputs.some((i) => i.deviceId === saved)) return saved;
      return inputs[0]!.deviceId;
    });
  }, [inputs]);

  if (status !== "live") return null;

  return (
    <div className="w-full max-w-md space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-[11px] text-neutral-400">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium uppercase tracking-wider text-neutral-500">
          Audio
        </span>
        <button
          type="button"
          onClick={() => void refreshDevices()}
          className="rounded border border-neutral-700 px-2 py-1 text-neutral-300 transition hover:bg-neutral-800"
        >
          Refresh devices
        </button>
      </div>

      {permNote && (
        <p className="text-amber-200/90">{permNote}</p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-neutral-500">Microphone → Anam</span>
        <select
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-200"
          value={micChoice}
          onChange={(e) => onMicChange(e.target.value)}
        >
          {inputs.length === 0 ? (
            <option value="">No inputs listed</option>
          ) : (
            inputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone ${d.deviceId.slice(0, 8)}…`}
              </option>
            ))
          )}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-neutral-500">
          Output volume (avatar speech)
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
      </label>

      {sinkSupported ? (
        <label className="flex flex-col gap-1">
          <span className="text-neutral-500">Output device (speakers / headset)</span>
          <select
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-200"
            value={sinkChoice}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setSinkChoice("");
                localStorage.removeItem(LS_SINK);
                return;
              }
              onSinkChange(v);
            }}
          >
            <option value="">System default</option>
            {outputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Output ${d.deviceId.slice(0, 8)}…`}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-neutral-600">
          Output device selection (setSinkId) is not supported in this browser — use
          system default audio output.
        </p>
      )}
    </div>
  );
}

/** Read saved mic id for Anam `createClient({ audioDeviceId })`. */
export function getStoredAnamMicDeviceId(): string | undefined {
  const id = readLs(LS_MIC).trim();
  return id || undefined;
}
