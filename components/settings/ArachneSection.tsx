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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateArachneSettings } from "@/features/settings/mutations.server";

export function ArachneSection() {
  const router = useRouter();
  const dto = useSettingsDto();
  const [pending, startTransition] = React.useTransition();

  const [streaming, setStreaming] = React.useState(dto.arachne.streaming);
  const [avatarQuality, setAvatarQuality] = React.useState(dto.arachne.avatarQuality);
  const [ttsVoice, setTtsVoice] = React.useState(dto.arachne.ttsVoice);
  const [sttModel, setSttModel] = React.useState(dto.arachne.sttModel);

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

  return (
    <Card size="sm" className={dashboardGlassCardClassName()}>
      <CardHeader className="space-y-0.5 pb-2">
        <CardTitle className="text-sm text-neutral-100">Arachne-X</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Advanced runtime — streaming, media fidelity, and speech models.
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
            <Label className="text-neutral-300">TTS voice</Label>
            <Select
              value={ttsVoice}
              disabled={pending}
              onValueChange={(v) => {
                setTtsVoice(v);
                persist({ ttsVoice: v });
              }}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectItem value="alloy">Alloy</SelectItem>
                <SelectItem value="echo">Echo</SelectItem>
                <SelectItem value="nova">Nova</SelectItem>
                <SelectItem value="sol">Sol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
              <SelectItem value="whisper-large">Whisper Large</SelectItem>
              <SelectItem value="whisper-medium">Whisper Medium</SelectItem>
              <SelectItem value="scribe-v1">Scribe v1 (beta)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-neutral-600">
            Inference catalog will drive these options at runtime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
