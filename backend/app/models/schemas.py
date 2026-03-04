from pydantic import BaseModel


class Position(BaseModel):
    x: int
    y: int


class NodeInfo(BaseModel):
    id: str
    name: str
    metadata: dict = {}


class EdgeInfo(BaseModel):
    source: str
    target: str
    condition: str | None = None


class GraphInfo(BaseModel):
    id: str
    name: str
    description: str = ""
    nodes: list[NodeInfo] = []
    edges: list[EdgeInfo] = []


class LayoutData(BaseModel):
    width: int
    height: int
    tiles: list = []
    furniture: list = []
    node_positions: dict[str, Position] = {}


class NodeEvent(BaseModel):
    type: str
    node_id: str
    timestamp: float
    data: dict = {}
