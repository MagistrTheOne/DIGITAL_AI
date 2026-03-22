/** MIRAZ / «Mira …» в display name — маркетинговое видео и Anam persona fallback. */
export function isMiraAnamEmployeeName(displayName: string): boolean {
  const n = displayName.trim().toLowerCase();
  if (n.includes("miraz")) return true;
  return /\bmira\b/.test(n);
}
