# ARACHNE / desktop avatar preview — HTTP contract

SaaS triggers T2V preview generation by **POST**ing JSON to **`ARACHNE_AVATAR_PREVIEW_URL`**. Inference runs on the worker (e.g. `infer.py`); Next.js only forwards prompts and persists the resulting URL or job id.

## Authentication

If **`NULLXES_REALTIME_SERVICE_KEY`** is set in the Next app, every request includes:

`X-NULLXES-Realtime-Service-Key: <same value>`

The worker should validate this header when exposed on a public URL (tunnel).

## Request body (JSON)

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| `employeeId` | string | yes | Tenant-scoped employee id |
| `displayName` | string | no | Employee display name |
| `promptHint` | string | no | Raw behavior / system prompt from config (legacy hint) |
| `positivePrompt` | string | yes | Full T2V positive prompt (matches RunPod worker semantics) |
| `negativePrompt` | string | yes | Full T2V negative prompt |
| `promptTemplateVersion` | number | yes | Template revision from `buildEmployeeAvatarPrompts` (worker may log) |
| `referenceImage` | string | no | Data URL or https URL for image-conditioned modes |
| `generationProfile` | object | no | Opaque `EmployeeConfigJson.renderProfile` (e.g. width, height, num_frames) |

Omitted optional keys may be absent from the JSON body.

## Success responses

**Asynchronous job** (client polls `/api/jobs/[jobId]`):

- HTTP 200 with JSON: `{ "jobId": "<string>" }`

**Synchronous completed video**:

- HTTP 200 with JSON containing an **http(s)** URL in one of: `videoUrl`, `previewUrl`, or `url`.

## Post-deploy precedence (Next.js)

1. If **`RUNPOD_API_KEY`** and **`RUNPOD_AVATAR_ENDPOINT_ID`** are set → **RunPod** enqueue only (no POST to `ARACHNE_AVATAR_PREVIEW_URL` on deploy).
2. Else if **`ARACHNE_AVATAR_PREVIEW_URL`** is set → POST as above on deploy; async jobs use job polling below.
3. Else → no automatic generation (user may still use manual Generate in UI when URL is added).

## Async job status polling

When the app stores `avatarPreviewJobId`, the browser polls **`GET /api/jobs/[jobId]`**.

1. Next tries **RunPod** status if RunPod is configured.
2. If still `generating` and **`ARACHNE_PREVIEW_JOB_STATUS_URL`** is set, Next GETs either:
   - URL with `{jobId}` replaced, e.g. `https://worker.example/status/{jobId}`, or  
   - `https://worker.example/status/<jobId>` appended.

Expected JSON shape from the status endpoint (examples):

- Ready: `status` in `ready` | `completed` | `success` and `videoUrl` or `url` as http(s).
- Failed: `status` in `failed` | `error` and `error` or `message` string.

## Related files

- Client POST: `app/api/employees/[employeeId]/avatar-preview/route.ts`
- Outbound fetch: `features/arachine-x/server/arachneAvatarPreview.server.ts`
- Deploy enqueue: `lib/inference/avatar-generation-after-deploy.server.ts`
- Prompts: `lib/inference/build-employee-avatar-prompt.server.ts`
- Job route: `app/api/jobs/[jobId]/route.ts`
