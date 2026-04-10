# avatar_worker_arachne

RunPod worker: **ARACHNE-X Video** text-to-video (`scripts/infer.py --mode t2v`).

## Expected HTTP input (RunPod JSON `input`)

Aligned with `runpod-avatar-arachne-session.server.ts`:

| Field | Type | Description |
|--------|------|-------------|
| `positive_prompt` | string | Full positive prompt |
| `negative_prompt` | string | Negative / safety prompt |
| `promptTemplateVersion` | number | Template revision |
| `height`, `width` | number | Frame size |
| `num_frames` | number | Clip length |
| `num_inference_steps` | number | Diffusion steps |
| `text_guidance_scale` | number | CFG |
| `sessionId` | string | UI session |
| `sequence` | number | Segment index |
| `employeeId` | string | Employee id |

## Output

Upload mp4 to object storage; return **https** `videoUrl` in RunPod output.

## Isolation

Use **`RUNPOD_ARACHNE_T2V_SESSION_ENDPOINT_ID`** on the SaaS side — do not reuse the employee **preview** endpoint (`RUNPOD_AVATAR_ENDPOINT_ID`).
