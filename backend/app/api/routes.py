from fastapi import APIRouter

from app.models.schemas import GraphInfo, LayoutData, NodeInfo, EdgeInfo

router = APIRouter(prefix="/api")

# Placeholder data
_DEMO_GRAPH = GraphInfo(
    id="demo",
    name="Demo Graph",
    description="A placeholder LangGraph agent",
    nodes=[
        NodeInfo(id="start", name="Start"),
        NodeInfo(id="agent", name="Agent"),
        NodeInfo(id="tools", name="Tools"),
        NodeInfo(id="end", name="End"),
    ],
    edges=[
        EdgeInfo(source="start", target="agent"),
        EdgeInfo(source="agent", target="tools", condition="needs_tool"),
        EdgeInfo(source="agent", target="end", condition="done"),
        EdgeInfo(source="tools", target="agent"),
    ],
)


@router.get("/graphs")
async def list_graphs() -> list[GraphInfo]:
    return [_DEMO_GRAPH]


@router.get("/graphs/{graph_id}/structure")
async def get_graph_structure(graph_id: str) -> dict:
    layout = LayoutData(width=20, height=15, node_positions={
        "start": {"x": 2, "y": 7},
        "agent": {"x": 8, "y": 7},
        "tools": {"x": 14, "y": 3},
        "end": {"x": 14, "y": 11},
    })
    return {"graph": _DEMO_GRAPH, "layout": layout}


@router.post("/graphs/{graph_id}/run")
async def run_graph(graph_id: str):
    # TODO: SSE stream with LangGraph execution
    return {"status": "not_implemented", "message": "SSE streaming coming soon"}
