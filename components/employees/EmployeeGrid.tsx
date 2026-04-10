"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AppHeader } from "@/components/app/AppHeader";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import { ROLE_FILTERS } from "@/features/employees/constants";
import type { EmployeeDTO } from "@/features/employees/types";
import { FilterTabs } from "@/components/shared/FilterTabs";

function filterEmployees(
  list: EmployeeDTO[],
  q: string,
  role: string,
): EmployeeDTO[] {
  const needle = q.trim().toLowerCase();
  let out = list ?? [];
  if (role !== "All") {
    out = out.filter((e) => e.roleCategory === role);
  }
  if (needle) {
    out = out.filter((e) => {
      const full = e.name.toLowerCase();
      const caps = (e.capabilities ?? []).some((c) =>
        c.toLowerCase().includes(needle),
      );
      return (
        full.includes(needle) ||
        e.roleLabel.toLowerCase().includes(needle) ||
        e.id.toLowerCase().includes(needle) ||
        caps
      );
    });
  }
  return out;
}

export function EmployeeGrid({
  employees = [],
  highlightEmployeeId = null,
  initialQuery = "",
}: {
  employees?: EmployeeDTO[];
  /** From `/ai-digital?employee=<id>` after deploy — scrolls card into view. */
  highlightEmployeeId?: string | null;
  /** Initial value from `?q=` (server) — kept in sync with the search field. */
  initialQuery?: string;
}) {
  const list = employees ?? [];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(initialQuery);
  const [role, setRole] = React.useState<string>("All");

  const urlSyncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  React.useEffect(
    () => () => {
      if (urlSyncTimerRef.current) clearTimeout(urlSyncTimerRef.current);
    },
    [],
  );

  const onSearchChange = React.useCallback(
    (value: string) => {
      setSearch(value);
      if (urlSyncTimerRef.current) clearTimeout(urlSyncTimerRef.current);
      urlSyncTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        const t = value.trim();
        if (t) params.set("q", t);
        else params.delete("q");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }, 280);
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    const id = highlightEmployeeId?.trim();
    if (!id) return;
    const t = window.setTimeout(() => {
      document
        .getElementById(`employee-card-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [highlightEmployeeId, list]);

  const items = ROLE_FILTERS.map((r) => ({
    value: r,
    label: r,
  }));

  const deferredSearch = React.useDeferredValue(search);

  const filtered = React.useMemo(
    () => filterEmployees(list, deferredSearch, role),
    [list, deferredSearch, role],
  );

  const showEmptyFilter =
    list.length > 0 && filtered.length === 0 && (search.trim() || role !== "All");

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        title="AI Digital"
        subtitle="Manage your digital workforce — search by name, role, id, or capability"
        searchValue={search}
        onSearchChange={onSearchChange}
      />

      <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-4">
        <FilterTabs
          value={role}
          onValueChange={setRole}
          items={items}
        />
      </div>

      {list.length === 0 ? (
        <p className="text-center text-sm text-neutral-500">
          No employees yet. Create one from the dashboard to get started.
        </p>
      ) : showEmptyFilter ? (
        <p className="rounded-lg border border-neutral-800 bg-neutral-950/40 px-4 py-10 text-center text-sm text-neutral-500">
          No employees match this search or role filter. Clear the search box or
          choose &quot;All&quot; to see everyone.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              highlight={
                Boolean(highlightEmployeeId?.trim()) &&
                employee.id === highlightEmployeeId?.trim()
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
