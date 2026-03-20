import Link from "next/link";

import { EmployeeInteractionPage } from "@/components/employee-interaction/EmployeeInteractionPage";
import { isAnamPreviewEnabledForEmployee } from "@/features/employees/anam.server";
import { getEmployeeForDashboard } from "@/features/employees/service.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import {
  getEmployeeRowById,
  type EmployeeConfigJson,
} from "@/services/db/repositories/employees.repository";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const employee = await getEmployeeForDashboard(employeeId);

  if (!employee) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-6 p-6">
        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <Link
            href="/ai-digital"
            className="text-neutral-400 transition-colors hover:text-neutral-200"
          >
            ← AI Digital
          </Link>
        </div>

        <Card className="border-neutral-800 bg-neutral-950/40">
          <CardHeader>
            <CardTitle className="text-neutral-200">Employee</CardTitle>
            <CardDescription className="text-neutral-500">
              Not found or you don&apos;t have access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-400">
            <p>
              <span className="text-neutral-500">ID:</span>{" "}
              <code className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-neutral-300">
                {employeeId}
              </code>
            </p>
            <p className="text-neutral-500">
              This employee doesn&apos;t exist or isn&apos;t in your workspace.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-4 border-neutral-700 text-neutral-200"
            >
              <Link href="/ai-digital">Back to directory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = await getCurrentSession();
  const userId = session?.user?.id;
  const row = userId ? await getEmployeeRowById(employeeId, userId) : null;
  const cfg = (row?.config ?? {}) as EmployeeConfigJson;
  const anamPreviewEnabled =
    Boolean(userId) && isAnamPreviewEnabledForEmployee(employeeId, cfg);

  return (
    <div className="flex flex-col gap-6 p-6">
      <EmployeeInteractionPage
        employeeId={employeeId}
        displayName={employee.name}
        roleLabel={employee.roleCategory}
        anamPreviewEnabled={anamPreviewEnabled}
      />
    </div>
  );
}
