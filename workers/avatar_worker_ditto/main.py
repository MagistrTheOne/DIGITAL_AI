"""
Minimal RunPod-handler-shaped FastAPI stub for Ditto talking-head workers.
Replace handler body with Ditto + SadTalker + Wav2Lip pipeline and object storage upload.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="avatar_worker_ditto")


class DittoInput(BaseModel):
    audioUrl: str = Field(..., min_length=8)
    imageUrl: str = Field(..., min_length=8)
    sessionId: str
    sequence: int
    employeeId: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/run")
async def run_sync(input: DittoInput) -> dict[str, Any]:
    """
    RunPod serverless typically invokes your handler with `input` dict.
    This route documents the contract; wire it to RunPod's expected entrypoint.
    """
    return {
        "error": "Stub: deploy GPU image with Ditto CLI + fallbacks. "
        f"Received sequence={input.sequence} session={input.sessionId!r}."
    }
