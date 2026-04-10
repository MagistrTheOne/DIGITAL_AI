# avatar_worker_ditto

RunPod serverless worker: **Ditto** talking-head (audio + reference image/video URL).

## Expected HTTP input (RunPod JSON `input`)

| Field | Type | Description |
|--------|------|-------------|
| `audioUrl` | string | https URL to speech audio (e.g. mp3 from SaaS blob) |
| `imageUrl` | string | https reference (employee preview mp4 URL or static image) |
| `sessionId` | string | UI session id |
| `sequence` | number | Segment index |
| `employeeId` | string | Tenant employee id |

## Output

Return RunPod `output` containing an **https** `videoUrl` (or `url` / `previewUrl` — see `runpod-v2.server.ts` extraction).

## Fallback chain (plan)

1. Ditto CLI  
2. SadTalker  
3. Wav2Lip  

Implement inside this container; set `engine_used` in logs. The SaaS stores `engine_requested=ditto` until a future callback updates `engine_used`.

## Local stub

`main.py` exposes a minimal FastAPI app for contract tests without GPU.
