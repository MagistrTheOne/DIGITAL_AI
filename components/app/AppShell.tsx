"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarNav } from "@/components/app/SidebarNav";
import { UserAccountButton } from "@/components/app/UserAccountButton";
import type { AccountDashboardDTO } from "@/features/account/types";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  account,
}: {
  children: React.ReactNode;
  account: AccountDashboardDTO | null;
}) {
  const pathname = usePathname();
  const employeeWorkspaceScrollLock =
    pathname === "/employees" || pathname.startsWith("/employees/");

  return (
    <SidebarProvider defaultOpen>
      <TooltipProvider delayDuration={250}>
        <div className="flex h-full min-h-0 w-full bg-neutral-950 text-neutral-200">
          <Sidebar
            collapsible="icon"
            className="border-r border-neutral-800 bg-neutral-950"
          >
            <SidebarHeader className="flex items-center justify-between gap-2 px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
              <div
                className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                aria-label="NULLXES"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-sm font-semibold text-neutral-100"
                  title="NULLXES"
                  aria-hidden
                >
                  N
                </div>
                <div className="min-w-0 truncate text-sm font-semibold leading-none text-neutral-200 group-data-[collapsible=icon]:hidden">
                  NULLXES
                </div>
              </div>
            </SidebarHeader>
            <SidebarSeparator className="bg-neutral-800" />
            <SidebarContent className="px-2 pb-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pb-2">
              <SidebarNav />
            </SidebarContent>
            <SidebarFooter className="px-2 pb-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pb-2">
              {account ? (
                <UserAccountButton user={account} />
              ) : (
                <div
                  className="min-h-[52px] rounded-lg border border-transparent"
                  aria-hidden
                />
              )}
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="min-h-0 flex-1 overflow-hidden bg-neutral-950">
            <div className="flex shrink-0 items-center gap-3 border-b border-neutral-800 px-6 py-4">
              <SidebarTrigger className="text-neutral-300" />
              <div className="h-4 w-px bg-neutral-800" />
              <div className="text-xs text-neutral-500">
                AI Workforce Platform
              </div>
            </div>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                employeeWorkspaceScrollLock
                  ? "overflow-hidden"
                  : "overflow-y-auto overflow-x-hidden",
              )}
            >
              {children}
            </div>
          </SidebarInset>

          <SidebarRail />
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
