"use client";

import { KeyRound, MonitorSmartphone } from "lucide-react";

import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const PLACEHOLDER_SESSIONS = [
  { id: "1", device: "Chrome · Windows", location: "Toronto, CA", when: "Active now" },
  { id: "2", device: "Safari · macOS", location: "New York, US", when: "2h ago" },
  { id: "3", device: "API · service token", location: "—", when: "12h ago" },
];

export function SecuritySection() {
  return (
    <Card size="sm" className={dashboardGlassCardClassName()}>
      <CardHeader className="space-y-0.5 pb-2">
        <CardTitle className="text-sm text-neutral-100">Security</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Sessions and programmatic access — connect to auth service later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <MonitorSmartphone className="size-4 text-neutral-500" />
            Active sessions
          </div>
          <ul className="divide-y divide-neutral-800/80 rounded-lg border border-neutral-800/80 bg-neutral-900/30">
            {PLACEHOLDER_SESSIONS.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-neutral-200">{s.device}</p>
                  <p className="text-xs text-neutral-600">{s.location}</p>
                </div>
                <span className="text-xs text-neutral-500">{s.when}</span>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="border-red-900/60 bg-transparent text-red-300 hover:bg-red-950/40 hover:text-red-200"
          >
            Log out all other sessions
          </Button>
        </div>

        <Separator className="bg-neutral-800/80" />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <KeyRound className="size-4 text-neutral-500" />
            API key
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-neutral-400">
              Secret key (placeholder)
            </Label>
            <Input
              id="api-key"
              readOnly
              type="password"
              value="sk-live-••••••••••••••••"
              className="border-neutral-800 bg-neutral-900/60 font-mono text-sm text-neutral-400"
            />
            <p className="text-xs text-neutral-600">
              Key rotation and scopes will live here.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
