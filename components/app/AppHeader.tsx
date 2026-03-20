"use client";

import * as React from "react";

import { SearchBar } from "@/components/shared/SearchBar";

export function AppHeader({
  title,
  subtitle,
  searchValue,
  onSearchChange,
}: {
  title: string;
  subtitle: string;
  /** Omit on other dashboard pages; required together for search UI. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const showSearch =
    typeof onSearchChange === "function" && typeof searchValue === "string";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-tight text-neutral-200">
            {title}
          </h1>
          <p className="text-sm text-neutral-400">{subtitle}</p>
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
