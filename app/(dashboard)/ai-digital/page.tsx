import { Suspense } from "react";

import { EmployeeGrid } from "@/components/employees/EmployeeGrid";
import { getEmployeesForDashboard } from "@/features/employees/service.server";

export default async function AiDigitalPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string; q?: string | string[] }>;
}) {
  const { employees } = await getEmployeesForDashboard();
  const sp = await searchParams;
  const highlightId =
    typeof sp.employee === "string" ? sp.employee.trim() || null : null;
  const qRaw = sp.q;
  const initialQuery =
    typeof qRaw === "string"
      ? qRaw
      : Array.isArray(qRaw)
        ? (qRaw[0] ?? "")
        : "";

  return (
    <div className="flex flex-col gap-6 p-6">
      <Suspense
        fallback={
          <p className="text-sm text-neutral-500">Loading directory…</p>
        }
      >
        <EmployeeGrid
          employees={employees}
          highlightEmployeeId={highlightId}
          initialQuery={initialQuery}
        />
      </Suspense>
    </div>
  );
}
