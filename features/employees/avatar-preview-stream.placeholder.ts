/**
 * Placeholder for future WebSocket-driven avatar preview job updates.
 * Wire when `NEXT_PUBLIC_AVATAR_PREVIEW_WS` (or server push) is defined.
 */
export function subscribeAvatarPreviewJob(
  _jobId: string,
  _onUpdate: (payload: { status: string; videoUrl?: string; error?: string }) => void,
): () => void {
  return () => {};
}
