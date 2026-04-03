"use client";

import { cn } from "@/lib/utils";

import { SETTINGS_NAV } from "@/components/settings/constants";
import type { SettingsSectionId } from "@/components/settings/types";

export function SettingsSidebar({
  active,
  onSelect,
}: {
  active: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-1 border-b border-neutral-800 pb-6",
        "lg:w-56 lg:rounded-xl lg:border lg:border-neutral-800/70 lg:bg-neutral-950/35 lg:pb-3 lg:pl-3 lg:pr-4 lg:pt-3",
        "lg:backdrop-blur-md lg:backdrop-saturate-150 lg:ring-1 lg:ring-white/5",
      )}
    >
      <div className="mb-4 hidden lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Control panel
        </p>
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col" aria-label="Settings">
        {SETTINGS_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex min-w-34 flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors lg:min-w-0",
                isActive
                  ? "bg-neutral-900/90 text-neutral-100 ring-1 ring-white/10"
                  : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200",
              )}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <span className="hidden text-xs text-neutral-500 lg:inline">
                {item.description}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
