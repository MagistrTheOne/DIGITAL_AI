import { getCurrentSession } from "@/lib/auth/session.server";
import { isIntegrationsEncryptionConfigured } from "@/lib/integrations/secret.server";
import { ClientApiIntegrationsPanel } from "@/components/employees/ClientApiIntegrationsPanel";
import { KnowledgeUploadPanel } from "@/components/employees/KnowledgeUploadPanel";
import { getEmployeeRowById } from "@/services/db/repositories/employees.repository";
import {
  listClientIntegrationsForEmployee,
} from "@/services/db/repositories/employee-integration.repository";
import { listKnowledgeDocumentsForEmployee } from "@/services/db/repositories/knowledge.repository";

export async function EmployeeWorkspaceIntegrations({
  employeeId,
}: {
  employeeId: string;
}) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) return null;

  const [integrations, documents] = await Promise.all([
    listClientIntegrationsForEmployee(userId, employeeId),
    listKnowledgeDocumentsForEmployee(userId, employeeId),
  ]);

  return (
    <section className="mt-8 border-t border-neutral-800 pt-8">
      <h2 className="text-lg font-medium tracking-tight text-neutral-200">
        Workspace tools
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-neutral-500">
        Connect an HTTPS client API for this employee (keys encrypted at rest) and
        upload reference text the assistant can search during chat.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ClientApiIntegrationsPanel
          employeeId={employeeId}
          initialIntegrations={integrations}
          encryptionConfigured={isIntegrationsEncryptionConfigured()}
        />
        <KnowledgeUploadPanel
          employeeId={employeeId}
          initialDocuments={documents}
        />
      </div>
    </section>
  );
}
