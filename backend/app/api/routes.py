from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.graph import registry
from app.graph.executor import format_sse_events, resume_graph
from app.graph.layout_generator import generate_layout
from app.models.schemas import GraphInfo

router = APIRouter(prefix="/api")


class RunInput(BaseModel):
    input: dict = {}
    config: dict = {}


class HumanInput(BaseModel):
    input: str | dict
    config: dict = {}


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
async def run_graph(graph_id: str, body: RunInput, request: Request):
    """Execute a graph and stream events via SSE."""
    try:
        compiled = registry.get_compiled(graph_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Graph '{graph_id}' not found")

    return EventSourceResponse(
        format_sse_events(compiled, body.input, body.config),
    )


@router.post("/graphs/{graph_id}/input")
async def provide_input(graph_id: str, body: HumanInput, request: Request):
    """Resume an interrupted graph with human input, streaming via SSE."""
    try:
        compiled = registry.get_compiled(graph_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Graph '{graph_id}' not found")

    return EventSourceResponse(
        resume_graph(compiled, body.input, body.config),
    )
