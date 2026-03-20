"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { EmployeeRoleFilter } from "@/features/employees/types";

export function FilterTabs({
  items,
  activeValue,
  basePath,
}: {
  items: Array<{ value: EmployeeRoleFilter; label: string }>;
  activeValue: EmployeeRoleFilter;
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const isActive = activeValue === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              if (item.value === "All") params.delete("role");
              else params.set("role", item.value);

              const qs = params.toString();
              router.push(qs ? `${basePath}?${qs}` : basePath, {
                scroll: false,
              });
            }}
            aria-pressed={isActive}
            className={[
              "rounded-full border px-3 py-1 text-xs transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

