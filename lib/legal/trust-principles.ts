export const TRUST_PRINCIPLES = [
  {
    title: "What we process",
    body: "We process account, billing, session, security, and product telemetry needed to run NULLXES. We do not sell personal data to data brokers. Any use of workspace content for model improvement or analytics beyond service delivery is described in our Privacy Policy and, where applicable, your agreement.",
  },
  {
    title: "No “data product” resale",
    body: "We do not monetize your user or employee lists as a standalone product. Subprocessors (for example hosting, email, and payments) may see data only as required to deliver those functions, under contracts and policies referenced in our Privacy Policy.",
  },
  {
    title: "Workspace isolation",
    body: "Customer data is scoped to workspaces and organizations. Access checks and storage paths are designed so one tenant’s operational data stays separated from another’s—this is logical and architectural isolation, not a claim about any specific certification unless stated in your contract.",
  },
  {
    title: "Atomic, transactional writes",
    body: "Core application state is persisted with transactional database semantics where it matters for consistency, so related updates succeed or roll back together. Backup, replication, and retention windows are described at a high level in Privacy; Enterprise and GovTech can align on DPA and runbooks.",
  },
  {
    title: "Retention & requests",
    body: "We retain data as long as needed for the service, billing, security, and legal obligations, then delete or anonymize according to our Privacy Policy. You may request access, correction, export, or deletion where applicable; we respond within the timeframes stated there.",
  },
] as const;
