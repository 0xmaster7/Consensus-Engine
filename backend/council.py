import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.hf_client import stream_all_models, stream_judge_response
from backend.voting import pick_winner
from backend.config import MODELS
from typing import Optional

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    messages: list[Message]
    models: Optional[dict[str, str]] = None
    judge_model: Optional[str] = "meta-llama/Meta-Llama-3.1-8B-Instruct"


@router.post("/query")
async def query_council(request: QueryRequest):
    """
    SSE endpoint. Each event is a JSON string on a `data:` line.
    Event types:
        token        — a single token from one model (stream this to the card)
        done         — one model finished (contains its full_response)
        vote_result  — sent once after ALL models finish (contains winner + scores)
        error        — a model failed
    """
    async def event_stream():
        completed_responses: dict[str, str] = {}
        msgs_dicts = [m.dict() for m in request.messages]
        models_dict = request.models if request.models else MODELS

        async for event in stream_all_models(msgs_dicts, models_dict):
            # Forward every event to the client immediately
            yield f"data: {json.dumps(event)}\n\n"

            # Collect completed responses for voting
            if event.get("type") == "done" and not event.get("error"):
                completed_responses[str(event["expert"])] = str(event["full_response"])

        # All models done — run original voting and send the result (optional but good for UI)
        if completed_responses:
            result = pick_winner(completed_responses)
            vote_event = {"type": "vote_result", **result}
            yield f"data: {json.dumps(vote_event)}\n\n"
            
            # Now stream the Judge LLM
            async for judge_event in stream_judge_response(msgs_dicts, completed_responses, request.judge_model or "meta-llama/Meta-Llama-3.1-8B-Instruct"):
                yield f"data: {json.dumps(judge_event)}\n\n"

        # Signal the stream is fully closed
        yield "data: {\"type\": \"stream_end\"}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",   # disables nginx buffering if used
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/health")
async def health():
    return {"status": "ok"}
