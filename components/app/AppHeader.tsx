import * as React from "react";

import { SearchBar } from "@/components/shared/SearchBar";

export function AppHeader({
  title,
  subtitle,
  searchQuery,
}: {
  title: string;
  subtitle: string;
  searchQuery?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold leading-tight">{title}</div>
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>

        {/* URL-backed search; updates `q` query param for server fetching. */}
        <div className="w-88">
          <SearchBar initialQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}

// Allow both `import { AppHeader }` and `import AppHeader` to avoid RSC import mismatches.
export default AppHeader;

