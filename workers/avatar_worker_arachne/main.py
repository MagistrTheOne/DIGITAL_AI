"""
Stub handler for ARACHNE-X Video T2V session jobs.
Production: shell out to `python scripts/infer.py --mode t2v ...` and upload mp4.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="avatar_worker_arachne")


class T2vInput(BaseModel):
    positive_prompt: str
    negative_prompt: str
    promptTemplateVersion: int = 2
    height: int = 512
    width: int = 512
    num_frames: int = 16
    num_inference_steps: int = 25
    text_guidance_scale: float = 7.5
    sessionId: str
    sequence: int
    employeeId: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/run")
async def run_sync(input: T2vInput) -> dict[str, Any]:
    return {
        "error": "Stub: bundle infer.py and checkpoints; upload resulting mp4. "
        f"sequence={input.sequence} session={input.sessionId!r}."
    }
