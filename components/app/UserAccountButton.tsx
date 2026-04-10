"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, BarChart3, Gauge, PauseCircle, Unplug } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import type { AccountDashboardDTO } from "@/features/account/types";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  parseUsageFraction,
  toProgressPercent,
} from "@/lib/utils/account-menu";

/** Alias for consumers that referenced the previous snapshot name. */
export type UserAccountSnapshot = AccountDashboardDTO;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function planBadgeVariant(
  plan: string,
): React.ComponentProps<typeof Badge>["variant"] {
  const p = plan.toLowerCase();
  if (p === "enterprise") return "default";
  if (p === "pro") return "secondary";
  return "outline";
}

function usageInsight(
  turns: ReturnType<typeof parseUsageFraction>,
  tokens: ReturnType<typeof parseUsageFraction>,
): "within" | "approaching" {
  const check = (p: ReturnType<typeof parseUsageFraction>) => {
    if (!p || p.limit === null) return false;
    const pct = toProgressPercent(p.used, p.limit);
    return pct !== undefined && pct >= 90;
  };
  return check(turns) || check(tokens) ? "approaching" : "within";
}

export type UserAccountButtonProps = {
  user: AccountDashboardDTO;
  className?: string;
};

export function UserAccountButton({ user, className }: UserAccountButtonProps) {
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = React.useState(false);
  const [endSessionsDialogOpen, setEndSessionsDialogOpen] =
    React.useState(false);

  const parsedTurns = React.useMemo(
    () => parseUsageFraction(user.usage.sessions),
    [user.usage.sessions],
  );
  const parsedTokens = React.useMemo(
    () => parseUsageFraction(user.usage.tokens),
    [user.usage.tokens],
  );

  const turnsPct =
    parsedTurns && parsedTurns.limit !== null
      ? toProgressPercent(parsedTurns.used, parsedTurns.limit)
      : undefined;
  const tokensPct =
    parsedTokens && parsedTokens.limit !== null
      ? toProgressPercent(parsedTokens.used, parsedTokens.limit)
      : undefined;

  const insight = usageInsight(parsedTurns, parsedTokens);

  const handleSignOut = React.useCallback(async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } catch {
      // Still navigate — local session may be cleared server-side
    } finally {
      setSigningOut(false);
      router.push("/sign-in");
      router.refresh();
    }
  }, [router]);

  const openPauseDialog = React.useCallback(() => {
    setMenuOpen(false);
    setPauseDialogOpen(true);
  }, []);

  const openEndSessionsDialog = React.useCallback(() => {
    setMenuOpen(false);
    setEndSessionsDialogOpen(true);
  }, []);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            title={collapsed ? user.name : undefined}
            aria-label={
              collapsed
                ? `Account menu for ${user.name}`
                : `Open account menu for ${user.name}`
            }
            className={cn(
              "h-auto w-full gap-2 rounded-lg border border-neutral-800 bg-neutral-950/80 px-2 py-2 text-left text-neutral-200 hover:bg-neutral-900 hover:text-neutral-200",
              collapsed && "justify-center border-transparent px-0 py-1.5",
              className,
            )}
          >
            <Avatar size="sm" className="shrink-0 border border-neutral-800">
              {user.image ? (
                <AvatarImage src={user.image} alt="" />
              ) : null}
              <AvatarFallback className="bg-neutral-800 text-xs font-medium text-neutral-200">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1 overflow-hidden text-left">
                <div className="truncate text-sm font-semibold leading-tight text-neutral-200">
                  {user.name}
                </div>
                <div className="truncate text-xs leading-tight text-neutral-500">
                  {user.email}
                </div>
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="right"
          sideOffset={8}
          className="w-72 border border-neutral-800 bg-neutral-950 p-0 text-neutral-200 shadow-lg"
        >
          {/* Identity */}
          <DropdownMenuGroup className="p-2">
            <DropdownMenuLabel className="flex items-center gap-1.5 px-0 py-0 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Identity
            </DropdownMenuLabel>
            <div className="mt-2 flex items-start gap-2">
              <Avatar size="sm" className="shrink-0 border border-neutral-800">
                {user.image ? (
                  <AvatarImage src={user.image} alt="" />
                ) : null}
                <AvatarFallback className="bg-neutral-800 text-xs font-medium text-neutral-200">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="truncate text-sm font-semibold text-neutral-200">
                  {user.name}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {user.email}
                </div>
                <div className="text-[11px] text-neutral-600">
                  Role · Account holder
                </div>
              </div>
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-neutral-800" />

          {/* System status */}
          <DropdownMenuGroup className="space-y-2 px-2 py-2">
            <DropdownMenuLabel className="flex items-center gap-1.5 px-0 py-0 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              <Activity className="size-3 text-neutral-600" aria-hidden />
              System status
            </DropdownMenuLabel>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className="border-neutral-700 text-[10px] font-normal text-neutral-400"
              >
                Control plane · OK
              </Badge>
              <Badge
                variant="outline"
                className="border-neutral-700 text-[10px] font-normal text-neutral-400"
              >
                Realtime · Ready
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border-neutral-700 text-[10px] font-normal",
                  insight === "approaching"
                    ? "text-amber-400/90"
                    : "text-neutral-400",
                )}
              >
                {insight === "approaching"
                  ? "Usage · Approaching limits"
                  : "Usage · Within plan"}
              </Badge>
            </div>
            <div className="text-xs text-neutral-500">
              Workforce ·{" "}
              <Link
                href="/ai-digital"
                className="text-neutral-300 underline-offset-2 hover:text-neutral-100 hover:underline"
                onClick={() => setMenuOpen(false)}
              >
                Manage digital employees
              </Link>
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-neutral-800" />

          {/* Usage / billing */}
          <DropdownMenuGroup className="space-y-3 px-2 py-2">
            <DropdownMenuLabel className="flex items-center gap-1.5 px-0 py-0 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              <Gauge className="size-3 text-neutral-600" aria-hidden />
              Usage · 30-day window
            </DropdownMenuLabel>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500">Plan</span>
              <Badge
                variant={planBadgeVariant(user.plan)}
                className="border-neutral-700 text-xs font-normal text-neutral-200"
              >
                {user.plan}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <BarChart3 className="size-3 shrink-0 text-neutral-600" />
                  AI turns (30d)
                </span>
                <span className="tabular-nums text-neutral-300">
                  {user.usage.sessions}
                </span>
              </div>
              {parsedTurns === null ? null : turnsPct !== undefined ? (
                <Progress
                  value={turnsPct}
                  className="h-1.5 bg-neutral-800 **:data-[slot=progress-indicator]:bg-neutral-400"
                />
              ) : (
                <p className="text-[11px] text-neutral-600">Unlimited turns</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span>Tokens (30d)</span>
                <span className="tabular-nums text-neutral-300">
                  {user.usage.tokens}
                </span>
              </div>
              {parsedTokens === null ? null : tokensPct !== undefined ? (
                <Progress
                  value={tokensPct}
                  className="h-1.5 bg-neutral-800 **:data-[slot=progress-indicator]:bg-neutral-400"
                />
              ) : (
                <p className="text-[11px] text-neutral-600">Unlimited tokens</p>
              )}
            </div>

            <p className="text-[10px] leading-snug text-neutral-600">
              Figures reflect successful AI interactions in the last 30 days, not
              live realtime socket count.
            </p>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-neutral-800" />

          {/* Control actions */}
          <DropdownMenuGroup className="p-1">
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Control
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer gap-2 rounded-sm text-neutral-300 focus:bg-neutral-900 focus:text-neutral-100"
              onSelect={(e) => {
                e.preventDefault();
                openPauseDialog();
              }}
            >
              <PauseCircle className="size-3.5 shrink-0 text-neutral-500" />
              Pause workspace activity
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2 rounded-sm text-neutral-300 focus:bg-neutral-900 focus:text-neutral-100"
              onSelect={(e) => {
                e.preventDefault();
                openEndSessionsDialog();
              }}
            >
              <Unplug className="size-3.5 shrink-0 text-neutral-500" />
              End all dashboard sessions
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-neutral-800" />

          {/* Navigation */}
          <DropdownMenuGroup className="p-1">
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Navigate
            </DropdownMenuLabel>
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-sm text-neutral-300 focus:bg-neutral-900 focus:text-neutral-100"
            >
              <Link href="/analytics" onClick={() => setMenuOpen(false)}>
                Analytics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-sm text-neutral-300 focus:bg-neutral-900 focus:text-neutral-100"
            >
              <Link href="/premium" onClick={() => setMenuOpen(false)}>
                Billing &amp; plans
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-sm text-neutral-300 focus:bg-neutral-900 focus:text-neutral-100"
            >
              <Link href="/settings" onClick={() => setMenuOpen(false)}>
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-sm text-neutral-300 focus:bg-neutral-900 focus:text-neutral-100"
            >
              <Link
                href="/settings?section=security"
                onClick={() => setMenuOpen(false)}
              >
                Security &amp; keys
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-neutral-800" />

          {/* Exit */}
          <div className="p-2">
            <Button
              type="button"
              variant="ghost"
              disabled={signingOut}
              className="h-9 w-full justify-start text-sm font-normal text-red-400 hover:bg-red-950/30 hover:text-red-300 focus-visible:ring-red-900"
              onClick={() => void handleSignOut()}
            >
              {signingOut ? "Signing out…" : "Log out"}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <AlertDialogContent className="border border-neutral-800 bg-neutral-950 text-neutral-200 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-100">
              Pause workspace activity
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-neutral-400">
              A global pause is not connected to the server yet. To reduce
              activity, stop individual employee sessions from their interaction
              view, adjust runtime defaults under{" "}
              <span className="text-neutral-300">Settings → Arachne-X</span>, or
              upgrade limits under Billing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-neutral-100">
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={endSessionsDialogOpen}
        onOpenChange={setEndSessionsDialogOpen}
      >
        <AlertDialogContent className="border border-neutral-800 bg-neutral-950 text-neutral-200 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-100">
              End all dashboard sessions
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-neutral-400">
              Bulk session termination is not available from this menu yet. Log
              out on this device below, or open{" "}
              <span className="text-neutral-300">Settings → Security</span> to
              manage API keys and access. Remote ARACHNE sessions follow worker
              timeouts on the engine side.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-neutral-100">
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
