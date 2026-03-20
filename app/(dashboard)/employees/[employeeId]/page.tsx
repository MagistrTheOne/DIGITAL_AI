import Link from "next/link";

import { STATIC_EMPLOYEES, displayName } from "@/components/employees/static-employees";
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
  const employee = STATIC_EMPLOYEES.find((e) => e.id === employeeId);

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
          <CardTitle className="text-neutral-200">
            {employee ? displayName(employee) : "Employee"}
          </CardTitle>
          <CardDescription className="text-neutral-500">
            {employee
              ? `${employee.role} · ${employee.verified ? "Verified" : "Unverified"}`
              : "Foundation placeholder — connect BFF / session runtime later."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-400">
          <p>
            <span className="text-neutral-500">ID:</span>{" "}
            <code className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-neutral-300">
              {employeeId}
            </code>
          </p>
          {!employee ? (
            <p className="text-neutral-500">
              No static profile for this id — route still resolves (no 404).
            </p>
          ) : (
            <p>Interaction / ARACHNE runtime will attach here in a later phase.</p>
          )}
          <Button asChild variant="outline" className="mt-4 border-neutral-700 text-neutral-200">
            <Link href="/ai-digital">Back to directory</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
