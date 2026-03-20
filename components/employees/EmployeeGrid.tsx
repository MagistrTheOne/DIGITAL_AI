"use client";

import * as React from "react";

import { AppHeader } from "@/components/app/AppHeader";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import {
  ROLE_FILTERS,
  STATIC_EMPLOYEES,
  type StaticEmployee,
} from "@/components/employees/static-employees";
import { FilterTabs } from "@/components/shared/FilterTabs";

function filterEmployees(
  list: StaticEmployee[],
  q: string,
  role: string,
): StaticEmployee[] {
  const needle = q.trim().toLowerCase();
  let out = list;
  if (role !== "All") {
    out = out.filter((e) => e.role === role);
  }
  if (needle) {
    out = out.filter((e) => {
      const full = `${e.firstName} vantage`.toLowerCase();
      return (
        full.includes(needle) ||
        e.role.toLowerCase().includes(needle) ||
        e.id.toLowerCase().includes(needle)
      );
    });
  }
  return out;
}

export function EmployeeGrid() {
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<string>("All");

  const items = ROLE_FILTERS.map((r) => ({
    value: r,
    label: r,
  }));

  const filtered = React.useMemo(
    () => filterEmployees(STATIC_EMPLOYEES, search, role),
    [search, role],
  );

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        title="AI Digital"
        subtitle="Manage your digital workforce"
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-4">
        <FilterTabs
          value={role}
          onValueChange={setRole}
          items={items}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>
    </div>
  );
}
