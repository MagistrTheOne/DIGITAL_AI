import { isIntegrationsEncryptionConfigured } from "@/lib/integrations/secret.server";
import { ClientApiIntegrationsPanel } from "@/components/employees/ClientApiIntegrationsPanel";
import { KnowledgeUploadPanel } from "@/components/employees/KnowledgeUploadPanel";
import { getEmployeeWorkspaceIntegrationsData } from "@/features/employees/service.server";

export async function EmployeeWorkspaceIntegrations({
  employeeId,
  /** When true, omit section chrome (used on `/employees/[id]/workspace` with its own page title). */
  titleless = false,
}: {
  employeeId: string;
  titleless?: boolean;
}) {
  const data = await getEmployeeWorkspaceIntegrationsData(employeeId);
  if (!data) return null;

  const { integrations, documents } = data;

  return (
    <section
      className={
        titleless ? "" : "mt-8 border-t border-neutral-800 pt-8"
      }
    >
      {!titleless ? (
        <>
          <h2 className="text-lg font-medium tracking-tight text-neutral-200">
            Workspace tools
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Connect an HTTPS client API for this employee (keys encrypted at rest)
            and upload reference text the assistant can search during chat.
          </p>
        </>
      ) : null}
      <div className={titleless ? "grid gap-6 lg:grid-cols-2" : "mt-6 grid gap-6 lg:grid-cols-2"}>
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
