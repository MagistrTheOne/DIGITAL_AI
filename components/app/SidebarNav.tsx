"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  { href: "/ai-digital", label: "AI Digital", icon: <Sparkles className="size-4" /> },
  { href: "/analytics", label: "Analytics", icon: <LineChart className="size-4" /> },
  {
    href: "/create-employee",
    label: "Create Employee",
    icon: <UserPlus className="size-4" />,
  },
  { href: "/settings", label: "Settings", icon: <Settings className="size-4" /> },
  { href: "/premium", label: "Premium", icon: <Gem className="size-4" /> },
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
                className="justify-start text-neutral-300"
              >
                <Link href={item.href} className="flex w-full items-center gap-2">
                  <span className="text-neutral-500">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

      <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
        <Sparkles className="size-4 shrink-0" />
        <span>Real-time sessions ready</span>
      </div>
    </SidebarGroup>
  );
}
