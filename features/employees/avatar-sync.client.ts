export type AvatarSyncResponse = {
  audioUrl: string;
  videoUrl: string | null;
};

export async function postAvatarSyncClip(input: {
  employeeId: string;
  text: string;
}): Promise<
  | { ok: true; body: AvatarSyncResponse }
  | { ok: false; error: string; status: number }
> {
  const res = await fetch("/api/avatar/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: input.employeeId,
      text: input.text,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const err =
      (typeof data.error === "string" && data.error) ||
      `Request failed (${res.status})`;
    return { ok: false, error: err, status: res.status };
  }

  const audioUrl = typeof data.audioUrl === "string" ? data.audioUrl : "";
  const videoUrl =
    typeof data.videoUrl === "string" && /^https?:\/\//i.test(data.videoUrl)
      ? data.videoUrl
      : null;

  if (!audioUrl) {
    return {
      ok: false,
      error: "Invalid sync response (missing audioUrl)",
      status: res.status,
    };
  }

  return {
    ok: true,
    body: { audioUrl, videoUrl },
  };
}
