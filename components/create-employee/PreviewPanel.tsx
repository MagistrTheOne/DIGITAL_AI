"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { EmployeeRoleCategory } from "@/features/employees/types";
import { cn } from "@/lib/utils";

function displayName(raw: string) {
  const t = raw.trim();
  if (!t) return "Agent Vantage";
  return t.toLowerCase().endsWith("vantage") ? t : `${t} Vantage`;
}

export function PreviewPanel({
  role,
  name,
  avatarPlaceholder,
  prompt,
  capabilities,
}: {
  role: EmployeeRoleCategory | null;
  name: string;
  avatarPlaceholder: string;
  prompt: string;
  capabilities: string[];
}) {
  const dn = displayName(name);

  return (
    <Card className="border-neutral-800 bg-neutral-950/50 shadow-none ring-0">
      <CardHeader>
        <CardTitle className="text-base text-neutral-100">Preview</CardTitle>
        <CardDescription className="text-neutral-500">
          What you&apos;re about to deploy — confirm before activation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-neutral-200">{dn}</span>
          {role ? (
            <Badge variant="outline" className="border-neutral-700 text-neutral-300">
              {role}
            </Badge>
          ) : (
            <span className="text-xs text-amber-500/90">Select a role</span>
          )}
        </div>
        <Separator className="bg-neutral-800" />
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Instructions
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-400">
            {prompt.trim() || "—"}
          </p>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Capabilities
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {capabilities.length === 0 ? (
              <span className="text-sm text-neutral-500">None selected</span>
            ) : (
              capabilities.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className={cn("border border-neutral-700 bg-neutral-900 text-neutral-300")}
                >
                  {c}
                </Badge>
              ))
            )}
          </div>
        </div>
        {avatarPlaceholder.trim() ? (
          <p className="text-xs text-neutral-500">
            Avatar note: {avatarPlaceholder.trim()}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
