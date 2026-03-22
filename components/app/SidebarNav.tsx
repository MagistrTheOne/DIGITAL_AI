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
  type LucideIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; Icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/ai-digital", label: "AI Digital", Icon: Sparkles },
  { href: "/analytics", label: "Analytics", Icon: LineChart },
  { href: "/create-employee", label: "Create Employee", Icon: UserPlus },
  { href: "/settings", label: "Settings", Icon: Settings },
  { href: "/premium", label: "Premium", Icon: Gem },
];

function NavLinkItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { Icon } = item;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className="text-neutral-300"
      >
        <Link href={item.href} className="flex w-full items-center gap-2">
          <span className="text-neutral-500" aria-hidden>
            <Icon className="size-4 shrink-0" />
          </span>
          <span className="truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

const NavLinkItemMemo = React.memo(NavLinkItem);

export const SidebarNav = React.memo(function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <NavLinkItemMemo key={item.href} item={item} isActive={isActive} />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
});
