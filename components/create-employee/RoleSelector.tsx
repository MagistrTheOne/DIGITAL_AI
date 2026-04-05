"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import type { EmployeeRoleCategory } from "@/features/employees/types";

import { ROLE_OPTIONS } from "@/components/create-employee/constants";

const OTHER: EmployeeRoleCategory = "Other";

export function RoleSelector({
  value,
  customTitle,
  onChange,
  onCustomTitleChange,
}: {
  value: EmployeeRoleCategory | null;
  customTitle: string;
  onChange: (role: EmployeeRoleCategory) => void;
  onCustomTitleChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-neutral-300">Primary role</Label>
      <RadioGroup
        value={value ?? ""}
        onValueChange={(v) => onChange(v as EmployeeRoleCategory)}
        className="grid gap-2 sm:grid-cols-2"
      >
        {ROLE_OPTIONS.map((role) => (
          <Label
            key={role}
            htmlFor={`role-${role}`}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-800/80 bg-neutral-900/40 px-3 py-2.5 text-sm text-neutral-200 hover:border-neutral-600 has-data-[state=checked]:border-neutral-500 has-data-[state=checked]:bg-neutral-900/80"
          >
            <RadioGroupItem value={role} id={`role-${role}`} className="border-neutral-600" />
            <span>{role}</span>
          </Label>
        ))}
        <Label
          htmlFor="role-other"
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-800/80 bg-neutral-900/40 px-3 py-2.5 text-sm text-neutral-200 hover:border-neutral-600 has-data-[state=checked]:border-neutral-500 has-data-[state=checked]:bg-neutral-900/80 sm:col-span-2"
        >
          <RadioGroupItem value={OTHER} id="role-other" className="border-neutral-600" />
          <span>Other (custom position)</span>
        </Label>
      </RadioGroup>
      {value === OTHER ? (
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="role-custom-input" className="text-xs text-neutral-500">
            Job title
          </Label>
          <Input
            id="role-custom-input"
            value={customTitle}
            onChange={(e) => onCustomTitleChange(e.target.value)}
            placeholder="e.g. HR Specialist, Legal Counsel"
            className="border-neutral-700 bg-neutral-950 text-neutral-100 placeholder:text-neutral-600"
            maxLength={80}
            autoComplete="organization-title"
          />
          <p className="text-[10px] text-neutral-600">2–80 characters.</p>
        </div>
      ) : null}
    </div>
  );
}
