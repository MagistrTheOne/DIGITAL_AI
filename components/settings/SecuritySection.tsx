"use client";

import * as React from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2, MonitorSmartphone, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
import { useSettingsDto } from "@/components/settings/settings-context";
import {
  createUserApiKeyAction,
  revokeOtherSessionsAction,
  revokeSessionByIdAction,
  revokeUserApiKeyAction,
} from "@/features/settings/security-actions.server";
import { cn } from "@/lib/utils";

export function SecuritySection() {
  const router = useRouter();
  const { security } = useSettingsDto();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [revokeOthersOpen, setRevokeOthersOpen] = React.useState(false);
  const [revokeSessionId, setRevokeSessionId] = React.useState<string | null>(
    null,
  );
  const [revokeKeyId, setRevokeKeyId] = React.useState<string | null>(null);

  const [keyDialogOpen, setKeyDialogOpen] = React.useState(false);
  const [newKeySecret, setNewKeySecret] = React.useState<string | null>(null);

  const clearError = () => setError(null);

  const runRevokeOthers = () => {
    clearError();
    startTransition(async () => {
      const r = await revokeOtherSessionsAction();
      setRevokeOthersOpen(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const runRevokeSession = () => {
    if (!revokeSessionId) return;
    clearError();
    const id = revokeSessionId;
    startTransition(async () => {
      const r = await revokeSessionByIdAction(id);
      setRevokeSessionId(null);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const runRevokeKey = () => {
    if (!revokeKeyId) return;
    clearError();
    const id = revokeKeyId;
    startTransition(async () => {
      const r = await revokeUserApiKeyAction(id);
      setRevokeKeyId(null);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const onCreateKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await createUserApiKeyAction(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setNewKeySecret(r.secret);
      router.refresh();
    });
  };

  const closeKeyDialog = () => {
    setKeyDialogOpen(false);
    setNewKeySecret(null);
    setError(null);
  };

  const copySecret = async () => {
    if (!newKeySecret) return;
    try {
      await navigator.clipboard.writeText(newKeySecret);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  return (
    <>
      <Card size="sm" className={dashboardGlassCardClassName()}>
        <CardHeader className="space-y-0.5 pb-2">
          <CardTitle className="text-sm text-neutral-100">Security</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Active sign-ins and API keys for programmatic access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <MonitorSmartphone className="size-4 text-neutral-500" />
              Active sessions
            </div>
            <ul className="divide-y divide-neutral-800/80 rounded-lg border border-neutral-800/80 bg-neutral-900/30">
              {security.sessions.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-neutral-500">
                  No sessions loaded.
                </li>
              ) : (
                security.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-neutral-200">{s.deviceLabel}</p>
                      <p className="text-xs text-neutral-600">{s.ipLabel}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                      <span className="text-xs text-neutral-500">
                        {s.activityLabel}
                      </span>
                      {!s.isCurrent ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-neutral-500 hover:bg-neutral-900 hover:text-red-400"
                          disabled={pending}
                          aria-label="Revoke session"
                          onClick={() => {
                            clearError();
                            setRevokeSessionId(s.id);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : (
                        <span className="text-xs text-neutral-600">
                          This session
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
            <Button
              type="button"
              variant="outline"
              disabled={pending || security.sessions.length < 2}
              className="border-red-900/60 bg-transparent text-red-300 hover:bg-red-950/40 hover:text-red-200"
              onClick={() => {
                clearError();
                setRevokeOthersOpen(true);
              }}
            >
              {pending ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : null}
              Log out all other sessions
            </Button>
            {security.sessions.length < 2 ? (
              <p className="text-xs text-neutral-600">
                Sign in from another browser to revoke additional sessions here.
              </p>
            ) : null}
          </div>

          <Separator className="bg-neutral-800/80" />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                <KeyRound className="size-4 text-neutral-500" />
                API keys
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
                onClick={() => {
                  clearError();
                  setNewKeySecret(null);
                  setKeyDialogOpen(true);
                }}
              >
                Generate key
              </Button>
            </div>
            <p className="text-xs text-neutral-600">
              Use{" "}
              <code className="text-neutral-400">
                Authorization: Bearer &lt;key&gt;
              </code>
              . The full secret is shown only once when you create a key.
            </p>
            <ul className="divide-y divide-neutral-800/80 rounded-lg border border-neutral-800/80 bg-neutral-900/30">
              {security.apiKeys.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-neutral-500">
                  No API keys yet.
                </li>
              ) : (
                security.apiKeys.map((k) => (
                  <li
                    key={k.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-neutral-200">
                        {k.prefix}
                      </p>
                      {k.name ? (
                        <p className="text-xs text-neutral-500">{k.name}</p>
                      ) : null}
                      <p className="text-xs text-neutral-600">
                        Created{" "}
                        {formatDistanceToNow(parseISO(k.createdAt), {
                          addSuffix: true,
                        })}
                        {k.lastUsedAt
                          ? ` · Last used ${formatDistanceToNow(parseISO(k.lastUsedAt), { addSuffix: true })}`
                          : " · Never used"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-neutral-500 hover:bg-neutral-900 hover:text-red-400"
                      disabled={pending}
                      aria-label="Revoke API key"
                      onClick={() => {
                        clearError();
                        setRevokeKeyId(k.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={revokeOthersOpen}
        onOpenChange={setRevokeOthersOpen}
      >
        <AlertDialogContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out other sessions?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Other devices will need to sign in again. This session stays
              signed in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-900 text-white hover:bg-red-800"
              onClick={(e) => {
                e.preventDefault();
                runRevokeOthers();
              }}
            >
              Log out others
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={revokeSessionId !== null}
        onOpenChange={(o) => {
          if (!o) setRevokeSessionId(null);
        }}
      >
        <AlertDialogContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              That device will be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-900 text-white hover:bg-red-800"
              onClick={(e) => {
                e.preventDefault();
                runRevokeSession();
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={revokeKeyId !== null}
        onOpenChange={(o) => {
          if (!o) setRevokeKeyId(null);
        }}
      >
        <AlertDialogContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Integrations using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-900 text-white hover:bg-red-800"
              onClick={(e) => {
                e.preventDefault();
                runRevokeKey();
              }}
            >
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={keyDialogOpen}
        onOpenChange={(o) => {
          if (!o) closeKeyDialog();
          else setKeyDialogOpen(true);
        }}
      >
        <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-100 sm:max-w-md">
          {!newKeySecret ? (
            <>
              <DialogHeader>
                <DialogTitle>Generate API key</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Optional label helps you remember where the key is used.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onCreateKeySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key-name" className="text-neutral-300">
                    Label (optional)
                  </Label>
                  <Input
                    id="api-key-name"
                    name="name"
                    placeholder="e.g. CI, staging worker"
                    disabled={pending}
                    className="border-neutral-800 bg-neutral-900/80 text-neutral-100"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-neutral-700 bg-transparent"
                    onClick={closeKeyDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={pending}
                    className={cn(
                      "bg-neutral-100 text-neutral-950 hover:bg-white",
                    )}
                  >
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Create key"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Save your key</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  This secret is not stored and cannot be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  readOnly
                  value={newKeySecret}
                  className="border-neutral-800 bg-neutral-900/80 font-mono text-sm text-neutral-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 bg-transparent text-neutral-200"
                  onClick={() => void copySecret()}
                >
                  <Copy className="mr-2 size-3.5" />
                  Copy
                </Button>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  className="bg-neutral-100 text-neutral-950 hover:bg-white"
                  onClick={closeKeyDialog}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
