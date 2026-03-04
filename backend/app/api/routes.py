from fastapi import APIRouter, HTTPException

from app.graph import registry
from app.graph.layout_generator import generate_layout
from app.models.schemas import GraphInfo

router = APIRouter(prefix="/api")


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
async def run_graph(graph_id: str):
    # TODO: SSE stream with LangGraph execution
    if graph_id not in [g.id for g in registry.list()]:
        raise HTTPException(status_code=404, detail=f"Graph '{graph_id}' not found")
    return {"status": "not_implemented", "message": "SSE streaming coming soon"}
