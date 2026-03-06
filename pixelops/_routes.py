from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from pixelops._executor import format_sse_events, resume_graph
from pixelops._layout import generate_layout
from pixelops._registry import registry
from pixelops._schemas import GraphInfo

router = APIRouter(prefix="/api")


class RunInput(BaseModel):
    input: dict = Field(default_factory=dict)


class HumanInput(BaseModel):
    input: str | dict


@router.get("/graphs")
async def list_graphs() -> list[GraphInfo]:
    return registry.list()


@router.get("/graphs/{graph_id}/structure")
async def get_graph_structure(graph_id: str) -> dict:
    try:
        graph = registry.get_structure(graph_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Graph '{graph_id}' not found")
    layout = generate_layout(graph)
    return {"graph": graph, "layout": layout}


@router.post("/graphs/{graph_id}/run")
async def run_graph(graph_id: str, body: RunInput):
    try:
        compiled = registry.get_compiled(graph_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Graph '{graph_id}' not found")
    return EventSourceResponse(
        format_sse_events(compiled, body.input),
    )


@router.post("/graphs/{graph_id}/input")
async def provide_input(graph_id: str, body: HumanInput):
    try:
        compiled = registry.get_compiled(graph_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Graph '{graph_id}' not found")
    return EventSourceResponse(
        resume_graph(compiled, body.input),
    )
