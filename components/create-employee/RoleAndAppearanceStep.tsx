"use client";

import type { EmployeeRoleCategory } from "@/features/employees/types";
import { WIZARD_AVATAR_PROMPT_TEMPLATE_LINES } from "@/lib/avatar/avatar-appearance-normalize";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { RoleSelector } from "@/components/create-employee/RoleSelector";

export function RoleAndAppearanceStep({
  appearanceDescription,
  onAppearanceChange,
  role,
  customTitle,
  onRoleChange,
  onCustomTitleChange,
}: {
  appearanceDescription: string;
  onAppearanceChange: (v: string) => void;
  role: EmployeeRoleCategory | null;
  customTitle: string;
  onRoleChange: (r: EmployeeRoleCategory | null) => void;
  onCustomTitleChange: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="emp-appearance" className="text-neutral-300">
          Appearance for video avatar
        </Label>
        <div
          className="rounded-md border border-neutral-800 bg-neutral-950/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-neutral-500"
          aria-hidden
        >
          {WIZARD_AVATAR_PROMPT_TEMPLATE_LINES.map((line, i) => (
            <div
              key={i}
              className={
                line.includes("<your look")
                  ? "text-amber-200/80"
                  : undefined
              }
            >
              {line}
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          Only the highlighted line is replaced by your text below. On Preview,{" "}
          <span className="text-neutral-400">Generate portrait</span> calls GPT
          Image using the full portrait prompt (same structure as post-deploy).
        </p>
        <Textarea
          id="emp-appearance"
          value={appearanceDescription}
          onChange={(e) => onAppearanceChange(e.target.value)}
          placeholder="e.g. CFO archetype, woman, early 40s, confident, navy suit, subtle smile — photorealistic"
          rows={4}
          className="resize-y border-neutral-800 bg-neutral-950 text-neutral-200 placeholder:text-neutral-600"
        />
        <p className="text-xs text-neutral-500">
          Used when generating the preview MP4 (T2V). Behavior and voice use the
          next steps; this shapes how they look on screen.
        </p>
      </div>

      <div className="space-y-3">
        <RoleSelector
          value={role}
          customTitle={customTitle}
          onChange={onRoleChange}
          onCustomTitleChange={onCustomTitleChange}
        />
      </div>
    </div>
  );
}
