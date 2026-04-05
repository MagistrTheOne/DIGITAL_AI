import Link from "next/link";

import { EmployeeInteractionPage } from "@/components/employee-interaction/EmployeeInteractionPage";
import {
  getEmployeeForDashboard,
  getEmployeeSessionBootstrap,
} from "@/features/employees/service.server";
import { isNullxesRealtimeVoiceEnvEnabled } from "@/lib/env/nullxes-realtime-voice.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function firstString(
  v: string | string[] | undefined,
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { employeeId } = await params;
  const sp = (await searchParams) ?? {};
  const nullxesSessionId =
    firstString(sp.nullxesSessionId) ?? firstString(sp.nx);
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

  const bootstrap = await getEmployeeSessionBootstrap(employeeId, {
    nullxesSessionId,
  });

  const openAiChatEnabled = Boolean(process.env.OPENAI_API_KEY?.trim());
  const realtimeVoiceEnabled =
    openAiChatEnabled && isNullxesRealtimeVoiceEnvEnabled();
  const avatarPreviewGenerateEnabled = Boolean(
    process.env.ARACHNE_AVATAR_PREVIEW_URL?.trim(),
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden p-6">
      <EmployeeInteractionPage
        key={`${employeeId}-${bootstrap.sessionId}`}
        bootstrap={bootstrap}
        employeeId={employeeId}
        displayName={employee.name}
        roleLabel={employee.roleLabel}
        openAiChatEnabled={openAiChatEnabled}
        realtimeVoiceEnabled={realtimeVoiceEnabled}
        avatarPreviewGenerateEnabled={avatarPreviewGenerateEnabled}
      />
    </div>
  );
}
