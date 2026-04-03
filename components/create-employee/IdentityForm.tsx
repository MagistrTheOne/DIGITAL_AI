"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0]![0] ?? ""}${p[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function IdentityForm({
  name,
  onNameChange,
  avatarPlaceholder,
  onAvatarPlaceholderChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  avatarPlaceholder: string;
  onAvatarPlaceholderChange: (v: string) => void;
}) {
  const display = name.trim() || "Name";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar className="size-16 border border-neutral-800">
          <AvatarFallback className="bg-neutral-800 text-lg text-neutral-200">
            {initials(display)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="emp-name" className="text-neutral-300">
            Display name
          </Label>
          <Input
            id="emp-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Anna"
            className="border-neutral-800 bg-neutral-950 text-neutral-200"
          />
          <p className="text-xs text-neutral-500">
            We&apos;ll append <span className="text-neutral-400">Vantage</span> for their public
            identity.
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
        <Label htmlFor="avatar-ph" className="text-neutral-300">
          Avatar note (optional)
        </Label>
        <Input
          id="avatar-ph"
          value={avatarPlaceholder}
          onChange={(e) => onAvatarPlaceholderChange(e.target.value)}
          placeholder="e.g. gradient / photo URL later"
          className="border-neutral-800 bg-neutral-950 text-neutral-200"
        />
        <p className="text-xs text-neutral-500">
          Placeholder only — image upload comes in a later release.
        </p>
      </div>
    </div>
  );
}
