import type { EmployeeConfigJson } from "@/services/db/repositories/employees.repository";

/** Default test slot — MIRAZ Vantage (remove when moving to DB-only config). */
export const ANAM_TEST_EMPLOYEE_ID_DEFAULT = "emp_841e5c78cab04a01";

const DEFAULT_TEST_AVATAR_ID = "dfff56df-d29a-40f8-8d5e-84ef712988fb";
/** Lab / org environment from Anam (optional; see ANAM_SESSION_SEND_ENVIRONMENT). */
const DEFAULT_TEST_ENVIRONMENT_ID = "41648ba8-b8b9-4e8f-a79c-982c6234fef7";

function testEmployeeId(): string {
  return (
    process.env.ANAM_TEST_EMPLOYEE_ID?.trim() || ANAM_TEST_EMPLOYEE_ID_DEFAULT
  );
}

/**
 * Resolve Anam persona ids: employee.config overrides, then env, then hardcoded test avatar for the test employee id.
 */
export function resolveAnamPersonaIds(
  employeeId: string,
  cfg: EmployeeConfigJson,
): {
  avatarId: string | undefined;
  voiceId: string | undefined;
  llmId: string | undefined;
  environmentId: string | undefined;
} {
  const isTestSlot = employeeId === testEmployeeId();

  const avatarId =
    cfg.anamAvatarId?.trim() ||
    (isTestSlot ? DEFAULT_TEST_AVATAR_ID : undefined) ||
    process.env.ANAM_AVATAR_ID?.trim();

  const voiceId =
    cfg.anamVoiceId?.trim() || process.env.ANAM_VOICE_ID?.trim();

  const llmId = cfg.anamLlmId?.trim() || process.env.ANAM_LLM_ID?.trim();

  const environmentId =
    cfg.anamEnvironmentId?.trim() ||
    process.env.ANAM_ENVIRONMENT_ID?.trim() ||
    (isTestSlot ? DEFAULT_TEST_ENVIRONMENT_ID : undefined);

  return { avatarId, voiceId, llmId, environmentId };
}

/**
 * Whether to show the Anam video slot (not the static AvatarStage).
 * Does not require ANAM_API_KEY — only persona ids; the session API still needs a valid key.
 */
export function isAnamPreviewEnabledForEmployee(
  employeeId: string,
  cfg: EmployeeConfigJson,
): boolean {
  const { avatarId, voiceId, llmId } = resolveAnamPersonaIds(
    employeeId,
    cfg,
  );
  return Boolean(avatarId && voiceId && llmId);
}
