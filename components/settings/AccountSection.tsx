"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Upload } from "lucide-react";

import { useSettingsDto } from "@/components/settings/settings-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  removeAvatarAction,
  uploadAvatarAction,
} from "@/features/account/avatar-actions.server";
import { resizeImageFileForAvatar } from "@/lib/utils/resize-image-client";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0]![0] ?? ""}${p[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function AccountSection() {
  const router = useRouter();
  const { account } = useSettingsDto();
  const [name, setName] = React.useState(account.name);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName(account.name);
  }, [account.name]);

  React.useEffect(() => {
    setLocalPreview(null);
  }, [account.image]);

  const displaySrc = localPreview ?? account.image ?? undefined;

  const onPickFile = () => {
    setError(null);
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    try {
      const resized = await resizeImageFileForAvatar(file, 512);
      const previewUrl = URL.createObjectURL(resized);
      setLocalPreview(previewUrl);

      const formData = new FormData();
      formData.append("file", resized);

      startTransition(async () => {
        const result = await uploadAvatarAction(formData);
        URL.revokeObjectURL(previewUrl);
        if (!result.ok) {
          setLocalPreview(null);
          setError(result.error);
          return;
        }
        setLocalPreview(null);
        router.refresh();
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not process image";
      setError(msg);
      setLocalPreview(null);
    }
  };

  const onRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card size="sm" className={dashboardGlassCardClassName()}>
      <CardHeader className="space-y-0.5 pb-2">
        <CardTitle className="text-sm text-neutral-100">Account</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Identity used across your AI workforce and billing profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFileChange}
              aria-hidden
            />

            <Avatar className="size-20 border border-neutral-800">
              {displaySrc ? (
                <AvatarImage
                  src={displaySrc}
                  alt=""
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-neutral-800 text-lg text-neutral-200">
                {initials(name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900",
                )}
                disabled={pending}
                onClick={onPickFile}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                {pending ? "Uploading…" : "Upload avatar"}
              </Button>
              {account.image ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-neutral-500 hover:bg-neutral-900 hover:text-red-400"
                  disabled={pending}
                  onClick={onRemove}
                  aria-label="Remove avatar"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
            </div>

            {error ? (
              <p className="max-w-56 text-center text-xs text-red-400 sm:text-left">
                {error}
              </p>
            ) : (
              <p className="max-w-56 text-center text-xs text-neutral-600 sm:text-left">
                JPEG, PNG, or WebP · max 2MB · resized to 512px before upload. Production:
                set <code className="text-neutral-400">BLOB_READ_WRITE_TOKEN</code> for
                Vercel Blob; local dev saves to{" "}
                <code className="text-neutral-400">/public/avatars</code> without it.
              </p>
            )}
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
              <p className="text-xs text-neutral-600">
                Profile name updates will sync when account API is wired.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-neutral-300">
                Email
              </Label>
              <Input
                id="settings-email"
                type="email"
                readOnly
                value={account.email ?? ""}
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
