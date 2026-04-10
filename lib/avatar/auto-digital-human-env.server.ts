/**
 * Full post-create pipeline: OpenAI portrait → Blob → ElevenLabs → InfiniteTalk → Blob video.
 *
 * Requires `NULLXES_AUTO_DIGITAL_HUMAN=1`, `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN`,
 * `RUNPOD_API_KEY`, `ELEVENLABS_API_KEY` (RunPod must fetch public https image/audio URLs).
 *
 * ## How to run / see the avatar
 *
 * 1. Set all env vars above + workspace **ElevenLabs voice** (Settings).
 * 2. **Create** or **deploy** an employee (`Create Employee` → Deploy) — the pipeline
 *    enqueues automatically (`enqueuePostDeployAvatarGeneration` → `runAutoDigitalHumanPipeline`).
 * 3. Open **`/employees/<id>`** — status polls under the preview card; when `videoPreviewUrl`
 *    is set, the **Avatar stage** shows the looping InfiniteTalk clip.
 * 4. If it **failed**, use **Retry** in the UI or `POST /api/employees/<id>/avatar-generation-retry`
 *    (same auth as session).
 * 5. Optional portrait before deploy: **`POST /api/employees/<id>/draft-portrait`** (draft only).
 */
export function isAutoDigitalHumanPipelineEnabled(): boolean {
  if (process.env.NULLXES_AUTO_DIGITAL_HUMAN?.trim() !== "1") return false;
  if (!process.env.OPENAI_API_KEY?.trim()) return false;
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) return false;
  if (!process.env.RUNPOD_API_KEY?.trim()) return false;
  if (!process.env.ELEVENLABS_API_KEY?.trim()) return false;
  return true;
}

export function autoDigitalHumanOpenAiImageModel(): string {
  return (
    process.env.NULLXES_AUTO_DIGITAL_HUMAN_IMAGE_MODEL?.trim() || "gpt-image-1.5"
  );
}

/** `images` = Images API (`openai.images.generate`). `responses` = Responses API + `image_generation` tool. */
export function autoDigitalHumanImageApi(): "images" | "responses" {
  const v = process.env.NULLXES_AUTO_DIGITAL_HUMAN_IMAGE_API?.trim().toLowerCase();
  return v === "responses" ? "responses" : "images";
}

/** Main model for Responses API when using `image_generation` (e.g. gpt-5). */
export function autoDigitalHumanResponsesModel(): string {
  return process.env.NULLXES_AUTO_DIGITAL_HUMAN_RESPONSES_MODEL?.trim() || "gpt-5";
}

/** Image model passed into the `image_generation` tool (e.g. gpt-image-1.5). */
export function autoDigitalHumanToolImageModel(): string {
  return (
    process.env.NULLXES_AUTO_DIGITAL_HUMAN_TOOL_IMAGE_MODEL?.trim() || "gpt-image-1.5"
  );
}
