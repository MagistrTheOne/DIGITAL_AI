"use client";

import type { EmployeeRoleCategory } from "@/features/employees/types";
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
        <Textarea
          id="emp-appearance"
          value={appearanceDescription}
          onChange={(e) => onAppearanceChange(e.target.value)}
          placeholder='e.g. Professional woman, early 30s, dark hair, black NULLXES-branded suit, modern office, speaking to camera — photorealistic'
          rows={4}
          className="resize-y border-neutral-800 bg-neutral-950 text-neutral-200 placeholder:text-neutral-600"
        />
        <p className="text-xs text-neutral-500">
          Used when generating the preview MP4 (T2V). Behavior and voice use the next
          steps; this shapes how they look on screen.
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
