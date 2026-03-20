"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type UserAccountSnapshot = {
  name: string;
  email: string;
  plan: string;
  usage: {
    sessions: string;
    tokens: string;
  };
};

/** Mock defaults — replace with session / BFF when wired. */
export const MOCK_USER_ACCOUNT: UserAccountSnapshot = {
  name: "Maxim",
  email: "ceo@nullxes.com",
  plan: "Free",
  usage: {
    sessions: "3 / 10",
    tokens: "120k / 500k",
  },
};

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

export type UserAccountButtonProps = {
  user?: UserAccountSnapshot;
  className?: string;
};

export function UserAccountButton({
  user = MOCK_USER_ACCOUNT,
  className,
}: UserAccountButtonProps) {
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [signingOut, setSigningOut] = React.useState(false);

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

  return (
    <DropdownMenu>
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
        <DropdownMenuGroup className="p-2">
          <DropdownMenuLabel className="px-0 py-0 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Account
          </DropdownMenuLabel>
          <div className="mt-2 flex items-start gap-2">
            <Avatar size="sm" className="shrink-0 border border-neutral-800">
              <AvatarFallback className="bg-neutral-800 text-xs font-medium text-neutral-200">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="truncate text-sm font-semibold text-neutral-200">
                {user.name}
              </div>
              <div className="truncate text-xs text-neutral-500">{user.email}</div>
              <Badge
                variant={planBadgeVariant(user.plan)}
                className="mt-1 w-fit border-neutral-700 text-[10px] font-normal uppercase tracking-wide text-neutral-400"
              >
                {user.plan}
              </Badge>
            </div>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-neutral-800" />

        <DropdownMenuGroup className="space-y-2 px-2 py-2">
          <DropdownMenuLabel className="px-0 py-0 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Subscription &amp; limits
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
          <div className="space-y-1 text-xs text-neutral-500">
            <div className="flex justify-between gap-4">
              <span>Sessions</span>
              <span className="tabular-nums text-neutral-300">
                {user.usage.sessions}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Tokens</span>
              <span className="tabular-nums text-neutral-300">
                {user.usage.tokens}
              </span>
            </div>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-neutral-800" />

        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem
            asChild
            className="cursor-pointer rounded-sm text-neutral-200 focus:bg-neutral-900 focus:text-neutral-200"
          >
            <Link href="/premium">Billing</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer rounded-sm text-neutral-200 focus:bg-neutral-900 focus:text-neutral-200"
          >
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <Separator className="bg-neutral-800" />

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
  );
}
