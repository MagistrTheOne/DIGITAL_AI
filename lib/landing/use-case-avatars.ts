/**
 * Avatar preview videos under `public/avatars/{folder}/`.
 * Primary `file` is tried first; `altFiles` covers common casing (e.g. Anna.mp4 vs anna.mp4).
 */
export type UseCaseAvatar = {
  id: string;
  /** Pascal-case folder under public/avatars */
  folder: string;
  /** Primary video filename */
  file: string;
  /** Additional filenames to try if the primary 404s (case-sensitive hosting) */
  altFiles?: readonly string[];
  firstName: string;
  role: string;
  body: string;
};

/** Filenames match `public/avatars/{folder}/` on disk. */
export const USE_CASE_AVATARS: UseCaseAvatar[] = [
  {
    id: "anna",
    folder: "Anna",
    file: "Anna.mp4",
    altFiles: ["anna.mp4"],
    firstName: "Anna",
    role: "HR",
    body: "Policy Q&A, intake screening, and consistent answers across time zones — without multiplying headcount.",
  },
  {
    id: "aris",
    folder: "Aris",
    file: "aris.mp4",
    altFiles: ["Aris.mp4"],
    firstName: "Aris",
    role: "Onboarding",
    body: "Role-specific walkthroughs, knowledge transfer, and session trails new hires can revisit.",
  },
  {
    id: "kira",
    folder: "Kira",
    file: "Kira.mp4",
    altFiles: ["kira.mp4"],
    firstName: "Kira",
    role: "Support & ops",
    body: "Tier-1 triage, runbooks, and escalation paths that stay on-brand while latency stays low.",
  },
  {
    id: "mira",
    folder: "Mira",
    file: "mira.mp4",
    altFiles: ["Mira.mp4"],
    firstName: "Mira",
    role: "Sales & success",
    body: "Discovery prep, follow-ups, and recap artifacts tied to your CRM workflows (via integrations).",
  },
  {
    id: "miraje",
    folder: "Miraje",
    file: "miraje.mp4",
    altFiles: ["Miraje.mp4"],
    firstName: "Miraje",
    role: "Compliance & risk",
    body: "Control narratives, policy attestations, and audit-friendly session trails your GRC team can stand behind.",
  },
  {
    id: "sirane",
    folder: "Sirane",
    file: "Sirane.mp4",
    altFiles: ["sirane.mp4"],
    firstName: "Sirane",
    role: "Learning & development",
    body: "Curriculum delivery, skills practice, and knowledge checks with repeatable sessions at scale.",
  },
];

/** Ordered URLs to try for this avatar’s preview video. */
export function avatarVideoUrls(a: UseCaseAvatar): string[] {
  const names = [a.file, ...(a.altFiles ?? [])];
  const seen = new Set<string>();
  const unique = names.filter((n) => {
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  return unique.map((f) => `/avatars/${a.folder}/${f}`);
}
