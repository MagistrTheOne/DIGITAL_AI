"use client";

import * as React from "react";
import { Upload } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export function AccountSection() {
  const [name, setName] = React.useState("Alex Morgan");

  return (
    <Card className="border-neutral-800 bg-neutral-950/50 shadow-none ring-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg text-neutral-100">Account</CardTitle>
        <CardDescription className="text-neutral-500">
          Identity used across your AI workforce and billing profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Avatar className="size-20 border border-neutral-800">
              <AvatarFallback className="bg-neutral-800 text-lg text-neutral-200">
                AM
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
              disabled
            >
              <Upload className="size-3.5" />
              Upload avatar
            </Button>
            <p className="max-w-[14rem] text-center text-xs text-neutral-600 sm:text-left">
              Image upload will connect to storage — placeholder for now.
            </p>
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="settings-name" className="text-neutral-300">
                Display name
              </Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-neutral-800 bg-neutral-900/80 text-neutral-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-neutral-300">
                Email
              </Label>
              <Input
                id="settings-email"
                type="email"
                readOnly
                value="alex@company.example"
                className="cursor-not-allowed border-neutral-800 bg-neutral-900/40 text-neutral-400"
              />
              <p className="text-xs text-neutral-600">
                Managed by your identity provider — read only.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
