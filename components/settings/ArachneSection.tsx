"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useSettingsDto } from "@/components/settings/settings-context";
import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createClientRuntimeCatalogPayload } from "@/lib/inference/runtime-catalog.client";
import { ELEVENLABS_TTS_MODEL_IDS } from "@/lib/inference/runtime-catalog.constants";
import type {
  ElevenLabsTtsVoice,
  RuntimeCatalogPayload,
  VoiceProviderId,
} from "@/lib/inference/runtime-catalog.types";
import { updateArachneSettings } from "@/features/settings/mutations.server";

function humanizeVoiceId(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function sttModelLabel(id: string): string {
  switch (id) {
    case "whisper-1":
      return "Whisper 1";
    case "gpt-4o-transcribe":
      return "GPT-4o transcribe";
    case "gpt-4o-mini-transcribe":
      return "GPT-4o mini transcribe";
    case "whisper-large":
      return "Whisper large (legacy label)";
    case "whisper-medium":
      return "Whisper medium (legacy label)";
    case "scribe-v1":
      return "Scribe v1 (legacy)";
    default:
      return id;
  }
}

function mergeOptionList(current: string, base: string[]): string[] {
  const set = new Set(base);
  if (current.trim()) set.add(current.trim());
  return Array.from(set);
}

type TtsVoiceSelectOption = { value: string; label: string };

function mergeElevenLabsVoiceRows(
  currentVoiceId: string,
  catalogVoices: ElevenLabsTtsVoice[],
): ElevenLabsTtsVoice[] {
  const trimmed = currentVoiceId.trim();
  const ordered = [...catalogVoices];
  const ids = new Set(ordered.map((v) => v.id));
  if (trimmed && !ids.has(trimmed)) {
    ordered.push({ id: trimmed, name: `${trimmed} (saved)` });
  }
  return ordered;
}

function elevenLabsModelLabel(id: string): string {
  return id
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function ArachneSection() {
  const router = useRouter();
  const dto = useSettingsDto();
  const [pending, startTransition] = React.useTransition();

  const [catalogPayload, setCatalogPayload] =
    React.useState<RuntimeCatalogPayload>(() =>
      createClientRuntimeCatalogPayload("primary"),
    );
  const [voiceProvider, setVoiceProvider] =
    React.useState<VoiceProviderId>("openai");

  const [streaming, setStreaming] = React.useState(dto.arachne.streaming);
  const [avatarQuality, setAvatarQuality] = React.useState(dto.arachne.avatarQuality);
  const [ttsVoice, setTtsVoice] = React.useState(dto.arachne.ttsVoice);
  const [sttModel, setSttModel] = React.useState(dto.arachne.sttModel);
  const [elevenLabsTtsModel, setElevenLabsTtsModel] = React.useState<string>(
    () => ELEVENLABS_TTS_MODEL_IDS[0] ?? "eleven_flash_v2_5",
  );
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setStreaming(dto.arachne.streaming);
    setAvatarQuality(dto.arachne.avatarQuality);
    setTtsVoice(dto.arachne.ttsVoice);
    setSttModel(dto.arachne.sttModel);
  }, [
    dto.arachne.streaming,
    dto.arachne.avatarQuality,
    dto.arachne.ttsVoice,
    dto.arachne.sttModel,
  ]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/runtime/catalog");
        if (!res.ok) throw new Error("catalog http");
        const json = (await res.json()) as RuntimeCatalogPayload;
        if (!cancelled) setCatalogPayload(json);
      } catch {
        if (!cancelled) {
          setCatalogPayload(createClientRuntimeCatalogPayload("fallback"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = catalogPayload.catalog;
  const catalogFallback = catalogPayload.isFallback;
  const elevenLabsEntry = catalog.tts.elevenlabs;

  React.useEffect(() => {
    const models = elevenLabsEntry?.models?.length
      ? elevenLabsEntry.models
      : [...ELEVENLABS_TTS_MODEL_IDS];
    setElevenLabsTtsModel((current) =>
      models.includes(current) ? current : (models[0] ?? "eleven_flash_v2_5"),
    );
  }, [elevenLabsEntry?.models]);

  const ttsVoiceSelectOptions = React.useMemo((): TtsVoiceSelectOption[] => {
    if (voiceProvider === "openai") {
      return mergeOptionList(ttsVoice, catalog.tts.openai.voices).map(
        (id) => ({
          value: id,
          label: humanizeVoiceId(id),
        }),
      );
    }
    const rows = mergeElevenLabsVoiceRows(
      ttsVoice,
      elevenLabsEntry?.voices ?? [],
    );
    return rows.map((v) => ({ value: v.id, label: v.name }));
  }, [catalog.tts.openai.voices, elevenLabsEntry?.voices, ttsVoice, voiceProvider]);

  const sttModelOptions = React.useMemo(() => {
    return mergeOptionList(sttModel, catalog.stt.openai.models);
  }, [catalog, sttModel]);

  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const persist = React.useCallback(
    (patch: Parameters<typeof updateArachneSettings>[0]) => {
      startTransition(async () => {
        const r = await updateArachneSettings(patch);
        if (r.ok) refresh();
      });
    },
    [refresh],
  );

  const playElevenLabsPreview = React.useCallback(async () => {
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/settings/elevenlabs-tts-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: ttsVoice.trim(),
          modelId: elevenLabsTtsModel,
          language: dto.aiDefaults.language,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  }, [ttsVoice, elevenLabsTtsModel, dto.aiDefaults.language]);

  const voiceSelectDisabled =
    pending ||
    (voiceProvider === "elevenlabs" &&
      elevenLabsEntry?.status === "disabled");

  const elevenLabsCatalogStatusLine = (() => {
    const st = elevenLabsEntry?.status;
    if (st === "ready") {
      return "Voices loaded from ElevenLabs (runtime catalog).";
    }
    if (st === "fallback") {
      return "ElevenLabs returned an error or the network failed — list may be empty; your saved voice id still applies.";
    }
    return "Catalog: no ElevenLabs key visible to the server, or the response is still cached. Put ELEVENLABS_API_KEY in .env or .env.local, restart npm run dev, then reload (in dev the catalog refreshes about every minute).";
  })();

  return (
    <Card size="sm" className={dashboardGlassCardClassName()}>
      <CardHeader className="space-y-0.5 pb-2">
        <CardTitle className="text-sm text-neutral-100">Realtime AI Agents</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Streaming and media quality. Avatar speech uses the TTS provider below;
          employee voice chat stays on OpenAI Realtime.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-3 py-2.5">
          <div className="space-y-0.5">
            <Label htmlFor="arachne-stream" className="text-neutral-200">
              Streaming responses
            </Label>
            <p className="text-xs text-neutral-600">
              Token-by-token output for lower perceived latency.
            </p>
          </div>
          <Switch
            id="arachne-stream"
            checked={streaming}
            disabled={pending}
            onCheckedChange={(v) => {
              setStreaming(v);
              persist({ streaming: v });
            }}
            className="data-checked:bg-emerald-600"
          />
        </div>

        <div className="space-y-2 sm:max-w-md">
          <Label className="text-neutral-300">Avatar TTS provider</Label>
          <Select
            value={voiceProvider}
            disabled={pending}
            onValueChange={(v) => setVoiceProvider(v as VoiceProviderId)}
          >
            <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
            </SelectContent>
          </Select>
          {voiceProvider === "openai" ? (
            <p className="text-xs text-neutral-600">
              OpenAI voices for avatar / synthesized speech. Employee push-to-talk
              still uses OpenAI Realtime. STT below uses OpenAI transcription APIs.
            </p>
          ) : (
            <div className="space-y-1.5 text-xs text-neutral-600">
              <p>{elevenLabsCatalogStatusLine}</p>
              <p>
                Avatar TTS only — how the avatar sounds. Employee voice chat stays
                on OpenAI Realtime.
              </p>
              <p className="text-neutral-500">
                ElevenLabs model below is session-only until we persist it in the
                database.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-neutral-300">Avatar quality</Label>
            <Select
              value={avatarQuality}
              disabled={pending}
              onValueChange={(v) => {
                setAvatarQuality(v);
                persist({ avatarQuality: v });
              }}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Avatar TTS voice</Label>
            <Select
              value={ttsVoice}
              disabled={voiceSelectDisabled}
              onValueChange={(v) => {
                setTtsVoice(v);
                persist({ ttsVoice: v });
              }}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                {ttsVoiceSelectOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {voiceProvider === "elevenlabs" ? (
          <div className="space-y-2 sm:max-w-md">
            <Label className="text-neutral-300">ElevenLabs TTS model</Label>
            <Select
              value={elevenLabsTtsModel}
              disabled={pending}
              onValueChange={setElevenLabsTtsModel}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                {(elevenLabsEntry?.models?.length
                  ? elevenLabsEntry.models
                  : [...ELEVENLABS_TTS_MODEL_IDS]
                ).map((id) => (
                  <SelectItem key={id} value={id}>
                    {elevenLabsModelLabel(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  pending ||
                  previewLoading ||
                  !ttsVoice.trim() ||
                  elevenLabsEntry?.status === "disabled"
                }
                onClick={() => void playElevenLabsPreview()}
                className="border-neutral-700 bg-neutral-900/80 text-neutral-100 hover:bg-neutral-800"
              >
                {previewLoading ? "Playing…" : "Preview voice"}
              </Button>
              <span className="text-xs text-neutral-500">
                Preview audio avatar
              </span>
            </div>
            {previewError ? (
              <p className="text-xs text-amber-600/90">{previewError}</p>
            ) : null}
            <p className="text-xs text-neutral-600">
              Avatar voice design only (not live chat). Model choice is not saved to
              the server yet — wire schema before persisting.
            </p>
          </div>
        ) : null}

        <div className="space-y-2 sm:max-w-md">
          <Label className="text-neutral-300">STT model</Label>
          <Select
            value={sttModel}
            disabled={pending}
            onValueChange={(v) => {
              setSttModel(v);
              persist({ sttModel: v });
            }}
          >
            <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              {sttModelOptions.map((id) => (
                <SelectItem key={id} value={id}>
                  {sttModelLabel(id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-neutral-600">
            Options follow the runtime catalog (OpenAI speech API).{" "}
            {catalogFallback
              ? "Showing fallback list (catalog endpoint unreachable or legacy rows)."
              : "Live catalog from /api/runtime/catalog."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
