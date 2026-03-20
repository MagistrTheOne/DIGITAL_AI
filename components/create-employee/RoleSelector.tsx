"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { EmployeeRoleCategory } from "@/features/employees/types";

import { ROLE_OPTIONS } from "@/components/create-employee/constants";

export function RoleSelector({
  value,
  onChange,
}: {
  value: EmployeeRoleCategory | null;
  onChange: (role: EmployeeRoleCategory) => void;
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
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-3 text-sm text-neutral-200 hover:border-neutral-600 has-data-[state=checked]:border-neutral-500 has-data-[state=checked]:bg-neutral-900/80"
          >
            <RadioGroupItem value={role} id={`role-${role}`} className="border-neutral-600" />
            <span>{role}</span>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
