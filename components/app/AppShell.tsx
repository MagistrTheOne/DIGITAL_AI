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

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md bg-primary/10 ring-1 ring-primary/20" />
              <div className="text-sm font-semibold leading-none">NULLXES</div>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent className="px-2 pb-2">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="px-2 pb-3">
            <div className="rounded-lg border bg-background p-2">
              <div className="text-xs text-muted-foreground">Plan</div>
              <div className="text-sm font-medium">Free</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Usage placeholder
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex min-h-[60vh] flex-col">
            <div className="flex items-center gap-3 px-6 py-4">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
              <div className="text-xs text-muted-foreground">
                AI Workforce Platform
              </div>
            </div>
            <div className="flex-1">{children}</div>
          </div>
        </SidebarInset>

        <SidebarRail />
      </div>
    </SidebarProvider>
  );
}

