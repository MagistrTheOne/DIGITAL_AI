import Link from "next/link";

import { EditEmployeeForm } from "@/components/employees/EditEmployeeForm";
import { getEmployeeForEdit } from "@/features/employees/service.server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const loaded = await getEmployeeForEdit(employeeId);

  if (!loaded.ok) {
    return (
      <div className="flex min-h-[50vh] flex-col gap-6 p-6">
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
            <CardTitle className="text-neutral-200">Can&apos;t edit</CardTitle>
            <CardDescription className="text-neutral-500">
              {loaded.error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="border-neutral-700">
              <Link href={`/employees/${encodeURIComponent(employeeId)}`}>
                Back to employee
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-center gap-2">
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
      </div>
      <EditEmployeeForm employeeId={loaded.employeeId} initialInput={loaded.input} />
    </div>
  );
}
