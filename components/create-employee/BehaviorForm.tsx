"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { CAPABILITY_OPTIONS } from "@/components/create-employee/constants";

export function BehaviorForm({
  prompt,
  onPromptChange,
  capabilities,
  onToggleCapability,
}: {
  prompt: string;
  onPromptChange: (v: string) => void;
  capabilities: string[];
  onToggleCapability: (cap: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="emp-prompt" className="text-neutral-300">
          Operating instructions
        </Label>
        <Textarea
          id="emp-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="How should this employee represent your brand? Tone, guardrails, escalation…"
          rows={6}
          className="resize-y border-neutral-800 bg-neutral-950 text-neutral-200"
        />
        <p className="text-xs text-neutral-500">
          This becomes the core system prompt for runtime (stored securely server-side).
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-neutral-300">Capabilities</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {CAPABILITY_OPTIONS.map((cap) => {
            const checked = capabilities.includes(cap);
            return (
              <Label
                key={cap}
                htmlFor={`cap-${cap}`}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-800/80 bg-neutral-900/40 px-3 py-2 text-sm text-neutral-200 hover:border-neutral-600"
              >
                <Checkbox
                  id={`cap-${cap}`}
                  checked={checked}
                  onCheckedChange={(v) => onToggleCapability(cap, v === true)}
                  className="border-neutral-600"
                />
                {cap}
              </Label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
