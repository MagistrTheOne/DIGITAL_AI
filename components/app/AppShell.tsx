"use client";

import * as React from "react";

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
import { SidebarNav } from "@/components/app/SidebarNav";
import { UserAccountButton } from "@/components/app/UserAccountButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full bg-neutral-950 text-neutral-200">
        <Sidebar
          collapsible="icon"
          className="border-r border-neutral-800 bg-neutral-950"
        >
          <SidebarHeader className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md border border-neutral-700 bg-neutral-900" />
              <div className="text-sm font-semibold leading-none text-neutral-200">
                NULLXES
              </div>
            </div>
          </SidebarHeader>
          <SidebarSeparator className="bg-neutral-800" />
          <SidebarContent className="px-2 pb-2">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="px-2 pb-3">
            <UserAccountButton />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-neutral-950">
          <div className="flex min-h-[60vh] flex-col">
            <div className="flex items-center gap-3 border-b border-neutral-800 px-6 py-4">
              <SidebarTrigger className="text-neutral-300" />
              <div className="h-4 w-px bg-neutral-800" />
              <div className="text-xs text-neutral-500">AI Workforce Platform</div>
            </div>
            <div className="flex-1">{children}</div>
          </div>
        </SidebarInset>

        <SidebarRail />
      </div>
    </SidebarProvider>
  );
}
