"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  UserPlus,
  Settings,
  Gem,
  Sparkles,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS: Array<{ href: string; label: string; icon: React.ReactNode }> = [
  { href: "/ai-digital", label: "AI Digital", icon: <Sparkles /> },
  { href: "/analytics", label: "Analytics", icon: <LineChart /> },
  {
    href: "/create-employee",
    label: "Create Employee",
    icon: <UserPlus />,
  },
  { href: "/settings", label: "Settings", icon: <Settings /> },
  { href: "/premium", label: "Premium", icon: <Gem /> },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className="justify-start"
              >
                <Link href={item.href} className="flex w-full items-center gap-2">
                  <span className="text-muted-foreground">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

      {/* Placeholder to match sidebar structure; plan indicator/auth goes in footer. */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="size-4" />
        <span>Real-time sessions ready</span>
      </div>
    </SidebarGroup>
  );
}

