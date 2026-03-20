"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useSettingsDto } from "@/components/settings/settings-context";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { updateAiDefaults } from "@/features/settings/mutations.server";

export function AiDefaultsSection() {
  const router = useRouter();
  const dto = useSettingsDto();
  const [pending, startTransition] = React.useTransition();
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const persist = React.useCallback(
    (patch: Parameters<typeof updateAiDefaults>[0]) => {
      startTransition(async () => {
        const r = await updateAiDefaults(patch);
        if (r.ok) refresh();
      });
    },
    [refresh],
  );

  return (
    <Card className="border-neutral-800 bg-neutral-950/50 shadow-none ring-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg text-neutral-100">AI defaults</CardTitle>
        <CardDescription className="text-neutral-500">
          Baseline behavior for new employees and sessions — stored for your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-neutral-300">Tone</Label>
            <Select
              value={tone}
              onValueChange={(v) => {
                setTone(v);
                persist({ tone: v });
              }}
              disabled={pending}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Language</Label>
            <Select
              value={language}
              onValueChange={(v) => {
                setLanguage(v);
                persist({ language: v });
              }}
              disabled={pending}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/80 text-neutral-100">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="voice-enabled" className="text-neutral-200">
              Voice enabled
            </Label>
            <p className="text-xs text-neutral-600">
              Allow speech I/O for compatible employees.
            </p>
          </div>
          <Switch
            id="voice-enabled"
            checked={voiceEnabled}
            disabled={pending}
            onCheckedChange={(v) => {
              setVoiceEnabled(v);
              persist({ voiceEnabled: v });
            }}
            className="data-checked:bg-emerald-600"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Label className="text-neutral-300">Latency vs quality</Label>
              <p className="mt-1 text-xs text-neutral-600">
                Trade faster responses for deeper reasoning when needed.
              </p>
            </div>
            <span className="text-xs tabular-nums text-neutral-500">
              {latencyQuality[0]}%
            </span>
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="w-14 shrink-0 text-xs text-neutral-500">Latency</span>
            <Slider
              value={latencyQuality}
              disabled={pending}
              onValueChange={(v) => {
                setLatencyQuality(v);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                  const n = v[0];
                  if (n !== undefined) persist({ latencyVsQuality: n });
                }, 450);
              }}
              max={100}
              step={1}
              className="flex-1 **:data-[slot=slider-range]:bg-neutral-400"
            />
            <span className="w-14 shrink-0 text-right text-xs text-neutral-500">
              Quality
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
