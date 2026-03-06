from __future__ import annotations

from typing import Any

from pixelops._schemas import EdgeInfo, GraphInfo, NodeInfo


class GraphRegistry:
    """Registry for compiled LangGraph graphs."""

    def __init__(self) -> None:
        self._graphs: dict[str, tuple[str, str, Any]] = {}

    def register(self, name: str, compiled_graph: Any, description: str = "") -> str:
        """Register a compiled graph. Returns its ID."""
        graph_id = name.lower().replace(" ", "_")
        self._graphs[graph_id] = (name, description, compiled_graph)
        return graph_id

    def list(self) -> list[GraphInfo]:
        return [self.get(graph_id) for graph_id in self._graphs]

    def get(self, graph_id: str) -> GraphInfo:
        if graph_id not in self._graphs:
            raise KeyError(f"Graph '{graph_id}' not found")
        name, description, compiled = self._graphs[graph_id]
        nodes, edges = self._extract_structure(compiled)
        return GraphInfo(
            id=graph_id,
            name=name,
            description=description,
            nodes=nodes,
            edges=edges,
        )

    def get_compiled(self, graph_id: str) -> Any:
        if graph_id not in self._graphs:
            raise KeyError(f"Graph '{graph_id}' not found")
        return self._graphs[graph_id][2]

    def get_structure(self, graph_id: str) -> GraphInfo:
        return self.get(graph_id)

    @staticmethod
    def _extract_structure(compiled: Any) -> tuple[list[NodeInfo], list[EdgeInfo]]:
        graph = compiled.get_graph()
        nodes = [
            NodeInfo(id=node_id, name=node_id, metadata=node.metadata or {})
            for node_id, node in graph.nodes.items()
            if node_id not in ("__start__", "__end__")
        ]
        edges = []
        for edge in graph.edges:
            source = edge.source
            target = edge.target
            if source == "__start__" or target == "__end__" or (
                source not in ("__start__", "__end__") and target not in ("__start__", "__end__")
            ):
                condition = getattr(edge, "condition", None)
                edges.append(EdgeInfo(
                    source=source,
                    target=target,
                    condition=condition if isinstance(condition, str) else None,
                ))
        return nodes, edges


# Singleton
registry = GraphRegistry()
