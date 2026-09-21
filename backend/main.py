"""FastAPI backend for Deep Research Agent."""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any, AsyncIterator, Dict, List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.research import (
    DEFAULT_MAX_DEPTH,
    DEFAULT_MAX_URLS,
    DEFAULT_TIME_LIMIT,
    run_research_process,
)

load_dotenv()

app = FastAPI(
    title="Deep Research Agent API",
    description="Deep web research powered by OpenAI Agents SDK and Firecrawl",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=1, description="Research topic or question")
    openai_api_key: Optional[str] = None
    firecrawl_api_key: Optional[str] = None
    max_depth: int = Field(DEFAULT_MAX_DEPTH, ge=1, le=10)
    time_limit: int = Field(DEFAULT_TIME_LIMIT, ge=30, le=600)
    max_urls: int = Field(DEFAULT_MAX_URLS, ge=1, le=50)


class ResearchResponse(BaseModel):
    topic: str
    initial_report: str
    enhanced_report: str
    sources: List[Any] = []
    status: Literal["success"] = "success"


class HealthResponse(BaseModel):
    status: str
    openai_configured: bool
    firecrawl_configured: bool


def _resolve_keys(body: ResearchRequest) -> tuple[str, str]:
    openai_key = (body.openai_api_key or os.getenv("OPENAI_API_KEY", "")).strip()
    firecrawl_key = (body.firecrawl_api_key or os.getenv("FIRECRAWL_API_KEY", "")).strip()
    if not openai_key or not firecrawl_key:
        raise HTTPException(
            status_code=400,
            detail=(
                "Both OpenAI and Firecrawl API keys are required. "
                "Set OPENAI_API_KEY and FIRECRAWL_API_KEY in the environment, "
                "or pass them in the request body."
            ),
        )
    return openai_key, firecrawl_key


def _sse(event: str, data: Dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        openai_configured=bool(os.getenv("OPENAI_API_KEY")),
        firecrawl_configured=bool(os.getenv("FIRECRAWL_API_KEY")),
    )


@app.post("/api/research", response_model=ResearchResponse)
async def research(body: ResearchRequest) -> ResearchResponse:
    topic = body.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic is required")

    openai_key, firecrawl_key = _resolve_keys(body)

    try:
        result = await run_research_process(
            topic,
            openai_key,
            firecrawl_key,
            max_depth=body.max_depth,
            time_limit=body.time_limit,
            max_urls=body.max_urls,
        )
        return ResearchResponse(
            topic=result["topic"],
            initial_report=result["initial_report"],
            enhanced_report=result["enhanced_report"],
            sources=result.get("sources") or [],
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/research/stream")
async def research_stream(body: ResearchRequest) -> StreamingResponse:
    topic = body.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic is required")

    openai_key, firecrawl_key = _resolve_keys(body)
    queue: asyncio.Queue[Optional[tuple[str, Dict[str, Any]]]] = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def on_activity(activity: Dict[str, Any]) -> None:
        loop.call_soon_threadsafe(
            queue.put_nowait,
            (
                "activity",
                {
                    "type": activity.get("type", "info"),
                    "message": activity.get("message", ""),
                },
            ),
        )

    def on_stage(stage: str) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, ("stage", {"stage": stage}))

    async def run_job() -> None:
        try:
            await queue.put(("stage", {"stage": "researching"}))
            result = await run_research_process(
                topic,
                openai_key,
                firecrawl_key,
                max_depth=body.max_depth,
                time_limit=body.time_limit,
                max_urls=body.max_urls,
                on_activity=on_activity,
                on_stage=on_stage,
            )
            await queue.put(
                (
                    "initial_report",
                    {"content": result["initial_report"]},
                )
            )
            await queue.put(
                (
                    "complete",
                    {
                        "topic": result["topic"],
                        "initial_report": result["initial_report"],
                        "enhanced_report": result["enhanced_report"],
                        "sources": result.get("sources") or [],
                    },
                )
            )
        except Exception as exc:  # noqa: BLE001
            await queue.put(("error", {"message": str(exc)}))
        finally:
            await queue.put(None)

    async def event_generator() -> AsyncIterator[str]:
        task = asyncio.create_task(run_job())
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                event, data = item
                yield _sse(event, data)
        finally:
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
