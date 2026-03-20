"use client";

import * as React from "react";

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

export function ArachneSection() {
  const [streaming, setStreaming] = React.useState(true);
  const [avatarQuality, setAvatarQuality] = React.useState("high");
  const [ttsVoice, setTtsVoice] = React.useState("nova");
  const [sttModel, setSttModel] = React.useState("whisper-large");

  return (
    <Card className="border-neutral-800 bg-neutral-950/50 shadow-none ring-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg text-neutral-100">Arachne-X</CardTitle>
        <CardDescription className="text-neutral-500">
          Advanced runtime — streaming, media fidelity, and speech models.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-8">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-3">
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
            onCheckedChange={setStreaming}
            className="data-checked:bg-emerald-600"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-neutral-300">Avatar quality</Label>
            <Select value={avatarQuality} onValueChange={setAvatarQuality}>
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
            <Select value={ttsVoice} onValueChange={setTtsVoice}>
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
          <Select value={sttModel} onValueChange={setSttModel}>
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
            Placeholder labels — swap for your inference catalog.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
