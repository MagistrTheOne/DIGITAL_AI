# ARACHNE-X — async avatar inference (contract)

This document describes how **GPU worker queues** relate to the **NULLXES web app** (`dai_saas`). The Next.js app does **not** call the worker’s job API directly.

## Who calls what

| Layer | Responsibility |
|--------|-----------------|
| **Browser** | WebSocket only: `chat.send`, receive events below. **No** `POST /v1/infer/jobs`. |
| **ARACHNE-X (aiohttp / gateway)** | Optional `NULLXES_AVATAR_INFERENCE_ASYNC=1`: enqueue on worker → poll → download MP4 once → same pipeline as sync (frames → `avatar.stream.chunk` with `encoding: "jpeg_base64"`). |
| **Worker pod (FastAPI + GPU)** | In-process queue: accept job → return `jobId` immediately → background inference → `GET …/result` returns `video/mp4` once. |

## Unchanged UI contract (WebSocket)

After `chat.send`, the client still expects:

1. `chat.message.received` (assistant text when applicable).
2. If avatar is enabled: `avatar.state.changed` (e.g. `speaking`) → `avatar.stream.chunk` (`jpeg_base64`) → `avatar.state.changed` (`idle`).
3. On failure: `session.error` with `message` (required) and optional `code` (recommended for stable handling).

Async queuing only changes **how long ARACHNE-X waits** on the worker; it does **not** change the shape of stream events.

## Recommended `session.error.code` values

Emit these from ARACHNE-X when mapping worker/queue failures so the dashboard can show clearer copy (see `formatSessionErrorMessage` in `features/arachine-x/session/sessionStateMachine.ts`).

| `code` | Meaning |
|--------|---------|
| `infer_queue_full` | Worker queue at `INFERENCE_MAX_QUEUE`; new job rejected. |
| `avatar_inference_failed` | Job finished with error or non-success status. |
| `avatar_inference_empty` | Job succeeded but produced no usable video bytes. |

Always include a human-readable `message` as well (fallback if `code` is unknown to the client).

## Scaling note

One worker replica = one in-memory queue. Multiple replicas without shared queue require sticky routing to the same pod or an external queue (e.g. Redis); that is outside this repo.

## Related docs

- [ARACHNE-X-dashboard-integration-contract.md](./ARACHNE-X-dashboard-integration-contract.md)
- [arachne-x-chat-scaffold.md](./arachne-x-chat-scaffold.md)
