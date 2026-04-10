/**
 * One-shot identity clip (InfiniteTalk) — required infrastructure.
 */
export function isIdentityClipInfrastructureConfigured(): boolean {
  const runpod = Boolean(process.env.RUNPOD_API_KEY?.trim());
  const eleven = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const devLocal =
    process.env.NODE_ENV === "development" &&
    !process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return runpod && eleven && (blob || devLocal);
}
