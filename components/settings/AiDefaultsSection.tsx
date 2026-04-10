"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useSettingsDto } from "@/components/settings/settings-context";
import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { updateAiDefaults } from "@/features/settings/mutations.server";
import { cn } from "@/lib/utils";

function SettingRow({
  label,
  description,
  control,
  className,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center justify-between gap-4 py-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1 pr-2">
        <div className="text-sm font-medium text-neutral-200">{label}</div>
        {description ? (
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        ) : null}
      </div>
      <div className="w-full max-w-[280px] shrink-0">{control}</div>
    </div>
  );
}

export function AiDefaultsSection() {
  const router = useRouter();
  const dto = useSettingsDto();
  const [pending, startTransition] = React.useTransition();

  const [tone, setTone] = React.useState(dto.aiDefaults.tone);
  const [language, setLanguage] = React.useState(dto.aiDefaults.language);
  const [voiceEnabled, setVoiceEnabled] = React.useState(dto.aiDefaults.voiceEnabled);
  const [latencyQuality, setLatencyQuality] = React.useState([
    dto.aiDefaults.latencyVsQuality,
  ]);

  React.useEffect(() => {
    setTone(dto.aiDefaults.tone);
    setLanguage(dto.aiDefaults.language);
    setVoiceEnabled(dto.aiDefaults.voiceEnabled);
    setLatencyQuality([dto.aiDefaults.latencyVsQuality]);
  }, [
    dto.aiDefaults.tone,
    dto.aiDefaults.language,
    dto.aiDefaults.voiceEnabled,
    dto.aiDefaults.latencyVsQuality,
  ]);

  const dirty = React.useMemo(() => {
    const l = latencyQuality[0] ?? 0;
    return (
      tone !== dto.aiDefaults.tone ||
      language !== dto.aiDefaults.language ||
      voiceEnabled !== dto.aiDefaults.voiceEnabled ||
      l !== dto.aiDefaults.latencyVsQuality
    );
  }, [dto.aiDefaults, tone, language, voiceEnabled, latencyQuality]);

  const save = React.useCallback(() => {
    const l = latencyQuality[0];
    if (l === undefined) return;
    startTransition(async () => {
      const r = await updateAiDefaults({
        tone,
        language,
        voiceEnabled,
        latencyVsQuality: l,
      });
      if (r.ok) router.refresh();
    });
  }, [tone, language, voiceEnabled, latencyQuality, router]);

  return (
    <Card size="sm" className={dashboardGlassCardClassName()}>
      <CardHeader className="space-y-0.5 pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-100">
          AI defaults
        </CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Workspace defaults for tone, language, voice, and inference bias.
        </CardDescription>
      </CardHeader>

      <CardContent className="divide-y divide-neutral-800/80 px-4 pb-0 pt-0">
        <SettingRow
          label="Tone"
          description="Default response style"
          control={
            <Select
              value={tone}
              onValueChange={setTone}
              disabled={pending}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <SettingRow
          label="Language"
          description="Primary output language. ElevenLabs avatar TTS uses this as language_code (ISO 639-1) when not Auto — see ElevenLabs text-to-speech API."
          control={
            <Select
              value={language}
              onValueChange={setLanguage}
              disabled={pending}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <div className="flex min-h-10 items-center justify-between gap-4 py-3">
          <span className="text-sm font-medium text-neutral-200">Voice</span>
          <div className="flex w-full max-w-[280px] shrink-0 justify-end">
            <Switch
              id="voice-enabled"
              checked={voiceEnabled}
              disabled={pending}
              onCheckedChange={setVoiceEnabled}
              className="data-checked:bg-emerald-600"
            />
          </div>
        </div>

        <div className="flex min-h-10 flex-wrap items-center gap-3 py-3 sm:flex-nowrap">
          <div className="min-w-18 shrink-0">
            <span className="text-sm font-medium text-neutral-200">Latency</span>
            <p className="text-xs text-neutral-500">vs quality</p>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Slider
              value={latencyQuality}
              disabled={pending}
              onValueChange={setLatencyQuality}
              max={100}
              step={1}
              className="flex-1 **:data-[slot=slider-range]:bg-neutral-400"
            />
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-neutral-400">
              {latencyQuality[0]}%
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-2 border-t border-neutral-800/80 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-600">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={!dirty || pending}
          onClick={save}
          className="shrink-0 bg-neutral-200 text-neutral-950 hover:bg-neutral-300 sm:min-w-32"
        >
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
