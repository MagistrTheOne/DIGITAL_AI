/**
 * Users often paste the full onboarding template into the look field.
 * We persist only the “look” lines that replace `{avatarPlaceholder}` in the real prompt
 * (`buildDigitalHumanPortraitPrompt` on the server).
 */

const BOILERPLATE_LINES = new Set(
  [
    "ultra realistic portrait of a professional digital human,",
    "{avatarPlaceholder},",
    "neutral facial expression,",
    "looking straight at camera,",
    "studio lighting,",
    "clean background,",
    "high detail skin texture,",
    "corporate appearance,",
    "no distortion,",
    "symmetrical face",
  ].map((s) => s.toLowerCase()),
);

export function normalizeAvatarLookDetailForStorage(raw: string): string {
  const t = raw.trim();
  if (!t) return "";

  const lines = t
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const hasBoilerplate = lines.some((l) => BOILERPLATE_LINES.has(l.toLowerCase()));
  if (!hasBoilerplate) {
    return t;
  }

  const kept = lines.filter((line) => !BOILERPLATE_LINES.has(line.toLowerCase()));
  return kept.join("\n").trim();
}

/**
 * Text passed to `buildDigitalHumanPortraitPrompt`: custom lines from step 1, or a
 * short role/name-based hint so GPT Image can run without a filled look field.
 */
export function resolvePortraitLookDetailForGeneration(input: {
  rawPlaceholder: string;
  /** Human role label (e.g. CFO or custom job title). */
  roleLabel: string;
  /** Display name (first word used as a light anchor). */
  displayName: string;
}): string {
  const custom = normalizeAvatarLookDetailForStorage(input.rawPlaceholder);
  if (custom) return custom;

  const rl = input.roleLabel.trim() || "Professional";
  const first =
    input.displayName.trim().split(/\s+/).filter(Boolean)[0] || "Colleague";
  return `${rl} archetype, professional digital human, ${first}, corporate attire, photorealistic portrait, neutral approachable expression`;
}

/** Shown in the wizard as read-only context (matches server portrait structure). */
export const WIZARD_AVATAR_PROMPT_TEMPLATE_LINES = [
  "Ultra realistic portrait of a professional digital human,",
  "<your look description goes here>,",
  "neutral facial expression,",
  "looking straight at camera,",
  "studio lighting,",
  "clean background,",
  "high detail skin texture,",
  "corporate appearance,",
  "no distortion,",
  "symmetrical face",
] as const;
