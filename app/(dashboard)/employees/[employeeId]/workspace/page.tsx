import Link from "next/link";

import { EmployeeWorkspaceIntegrations } from "@/components/employees/EmployeeWorkspaceIntegrations";
import { getEmployeeForDashboard } from "@/features/employees/service.server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EmployeeWorkspacePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const employee = await getEmployeeForDashboard(employeeId);

  if (!employee) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-6 p-6">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          asChild
        >
          <Link href="/ai-digital">← AI Digital</Link>
        </Button>
        <Card className="border-neutral-800 bg-neutral-950/40">
          <CardHeader>
            <CardTitle className="text-neutral-200">Workspace tools</CardTitle>
            <CardDescription className="text-neutral-500">
              Employee not found or you don&apos;t have access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="border-neutral-700 text-neutral-200"
            >
              <Link href="/ai-digital">Back to directory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-6">
      <header className="mb-6 shrink-0 space-y-4 border-b border-neutral-800 pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          asChild
        >
          <Link href={`/employees/${encodeURIComponent(employeeId)}`}>
            ← Back to chat
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">
            Workspace tools
          </h1>
          <p className="max-w-2xl text-sm text-neutral-500">
            <span className="text-neutral-400">{employee.name}</span>
            {employee.roleLabel ? (
              <span className="text-neutral-600"> · {employee.roleLabel}</span>
            ) : null}
            {" — "}
            connect client APIs and upload knowledge this assistant can search in
            chat.
          </p>
        </div>
      </header>
      <EmployeeWorkspaceIntegrations employeeId={employeeId} titleless />
    </div>
  );
}
