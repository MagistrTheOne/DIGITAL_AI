"use client";

import * as React from "react";

import { SearchBar } from "@/components/shared/SearchBar";
import { cn } from "@/lib/utils";

export function AppHeader({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  compact,
}: {
  title: string;
  subtitle: string;
  /** Tighter typography for dense dashboards (e.g. analytics). */
  compact?: boolean;
  /** Omit on other dashboard pages; required together for search UI. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const showSearch =
    typeof onSearchChange === "function" && typeof searchValue === "string";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1
            className={cn(
              "font-semibold leading-tight text-neutral-200",
              compact ? "text-xl" : "text-2xl",
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              "text-neutral-400",
              compact ? "max-w-2xl text-xs leading-snug" : "text-sm",
            )}
          >
            {subtitle}
          </p>
        </div>
        {showSearch ? (
          <div className="w-full shrink-0 sm:max-w-xs">
            <SearchBar
              value={searchValue}
              onChange={onSearchChange}
              placeholder="Search employees"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AppHeader;
