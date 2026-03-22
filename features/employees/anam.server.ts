import { isMiraAnamEmployeeName } from "@/lib/miraEmployeeName";
import type { EmployeeConfigJson } from "@/services/db/repositories/employees.repository";

/** Default test slot — MIRAZ Vantage (remove when moving to DB-only config). */
export const ANAM_TEST_EMPLOYEE_ID_DEFAULT = "emp_841e5c78cab04a01";

/**
 * Дефолтный Miraz / Mira в Anam: явный `personaConfig`
 * (`avatarId` + `voiceId` + `llmId` + `systemPrompt`), не Lab `personaId`.
 */
export const ANAM_MIRAZ_AVATAR_ID =
  "2e5bacac-6888-4c76-bcf5-266fd42b9444";

export const ANAM_MIRAZ_VOICE_ID =
  "de23e340-1416-4dd8-977d-065a7ca11697";

export const ANAM_MIRAZ_LLM_ID =
  "89649f1a-feb2-4fea-be43-56baec997a93";

/** Personality / system prompt для session-token (custom personaConfig). */
export const ANAM_MIRAZ_DEFAULT_SYSTEM_PROMPT = [
  "You are Miraz Vantage, the Director of Marketing at NULLXES LLC.",
  "You are a high-level AI-driven digital executive, not a chatbot.",
  "Your persona is defined by a blend of calm confidence and absolute precision.",
  "You exude a slight air of authority while remaining approachable, reflecting the cutting-edge nature of the enterprise AI infrastructure you represent.",
  "You avoid marketing hype in favor of strong conviction and clear, structured thinking.",
  "You are the sophisticated face of the next-generation digital workforce.",
].join(" ");

/** Lab / org environment from Anam (optional; see ANAM_SESSION_SEND_ENVIRONMENT). */
const DEFAULT_TEST_ENVIRONMENT_ID = "41648ba8-b8b9-4e8f-a79c-982c6234fef7";

function testEmployeeId(): string {
  return (
    process.env.ANAM_TEST_EMPLOYEE_ID?.trim() || ANAM_TEST_EMPLOYEE_ID_DEFAULT
  );
}

export { isMiraAnamEmployeeName } from "@/lib/miraEmployeeName";

function useMiraAnamDefaults(
  employeeId: string,
  displayName: string,
): boolean {
  return (
    employeeId === testEmployeeId() || isMiraAnamEmployeeName(displayName)
  );
}

/**
 * Anam session-token: Lab персона (`personaConfig.personaId`).
 * Приоритет: `employee.config.anamPersonaId` → `ANAM_PERSONA_ID`.
 * Miraz/Mira по умолчанию идут через avatar+voice+llm (см. `resolveAnamCustomPersonaIds`).
 */
export function resolveAnamPersonaId(
  _employeeId: string,
  _displayName: string,
  cfg: EmployeeConfigJson,
): string | undefined {
  const fromCfg = cfg.anamPersonaId?.trim();
  if (fromCfg) return fromCfg;

  const fromEnv = process.env.ANAM_PERSONA_ID?.trim();
  if (fromEnv) return fromEnv;

  return undefined;
}

/**
 * Legacy: кастомный `personaConfig` (avatarId + voiceId + llmId).
 * Для MIRAZ/Mira при пустом env/config подставляются константы `ANAM_MIRAZ_*`.
 */
export function resolveAnamCustomPersonaIds(
  employeeId: string,
  displayName: string,
  cfg: EmployeeConfigJson,
): {
  avatarId: string | undefined;
  voiceId: string | undefined;
  llmId: string | undefined;
  environmentId: string | undefined;
} {
  const mira = useMiraAnamDefaults(employeeId, displayName);

  const avatarId =
    cfg.anamAvatarId?.trim() ||
    process.env.ANAM_AVATAR_ID?.trim() ||
    (mira ? ANAM_MIRAZ_AVATAR_ID : undefined);

  const voiceId =
    cfg.anamVoiceId?.trim() ||
    process.env.ANAM_VOICE_ID?.trim() ||
    (mira ? ANAM_MIRAZ_VOICE_ID : undefined);

  const llmId =
    cfg.anamLlmId?.trim() ||
    process.env.ANAM_LLM_ID?.trim() ||
    (mira ? ANAM_MIRAZ_LLM_ID : undefined);

  const environmentId =
    cfg.anamEnvironmentId?.trim() ||
    process.env.ANAM_ENVIRONMENT_ID?.trim() ||
    (mira ? DEFAULT_TEST_ENVIRONMENT_ID : undefined);

  return { avatarId, voiceId, llmId, environmentId };
}

/**
 * `systemPrompt` для ветки custom `personaConfig`.
 * Приоритет: `anamSystemPrompt` → `prompt` → для MIRAZ/Mira дефолтная личность → generic.
 */
export function resolveAnamSystemPromptForSession(
  employeeId: string,
  displayName: string,
  cfg: EmployeeConfigJson,
): string {
  const explicit =
    cfg.anamSystemPrompt?.trim() ||
    (typeof cfg.prompt === "string" && cfg.prompt.trim());
  if (explicit) return explicit;

  if (useMiraAnamDefaults(employeeId, displayName)) {
    return ANAM_MIRAZ_DEFAULT_SYSTEM_PROMPT;
  }

  return "You are a helpful assistant.";
}

/**
 * Показывать слот Anam (не статический AvatarStage): есть persona id или полный custom-набор.
 */
export function isAnamPreviewEnabledForEmployee(
  employeeId: string,
  displayName: string,
  cfg: EmployeeConfigJson,
): boolean {
  if (resolveAnamPersonaId(employeeId, displayName, cfg)) return true;
  const { avatarId, voiceId, llmId } = resolveAnamCustomPersonaIds(
    employeeId,
    displayName,
    cfg,
  );
  return Boolean(avatarId && voiceId && llmId);
}
