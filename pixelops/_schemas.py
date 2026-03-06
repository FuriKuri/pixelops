from __future__ import annotations

from pydantic import BaseModel, Field


class Position(BaseModel):
    x: int
    y: int


class NodeInfo(BaseModel):
    id: str
    name: str
    metadata: dict = Field(default_factory=dict)


class EdgeInfo(BaseModel):
    source: str
    target: str
    condition: str | None = None


class GraphInfo(BaseModel):
    id: str
    name: str
    description: str = ""
    nodes: list[NodeInfo] = Field(default_factory=list)
    edges: list[EdgeInfo] = Field(default_factory=list)


class LayoutData(BaseModel):
    width: int
    height: int
    tiles: list = Field(default_factory=list)
    furniture: list = Field(default_factory=list)
    node_positions: dict[str, Position] = Field(default_factory=dict)


class NodeEvent(BaseModel):
    type: str
    node_id: str
    timestamp: float
    data: dict = Field(default_factory=dict)
