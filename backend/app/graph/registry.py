from __future__ import annotations

from langgraph.graph.state import CompiledStateGraph as CompiledGraph

from app.models.schemas import EdgeInfo, GraphInfo, NodeInfo


class GraphRegistry:
    """Registry for compiled LangGraph graphs."""

    def __init__(self) -> None:
        self._graphs: dict[str, tuple[str, str, CompiledGraph]] = {}

    def register(self, name: str, compiled_graph: CompiledGraph, description: str = "") -> str:
        """Register a compiled graph. Returns its ID."""
        graph_id = name.lower().replace(" ", "_")
        self._graphs[graph_id] = (name, description, compiled_graph)
        return graph_id

    def list(self) -> list[GraphInfo]:
        """List all registered graphs with structure info."""
        return [self.get(graph_id) for graph_id in self._graphs]

    def get(self, graph_id: str) -> GraphInfo:
        """Get graph info by ID."""
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

    def get_compiled(self, graph_id: str) -> CompiledGraph:
        """Get the compiled graph for execution."""
        if graph_id not in self._graphs:
            raise KeyError(f"Graph '{graph_id}' not found")
        return self._graphs[graph_id][2]

    def get_structure(self, graph_id: str) -> GraphInfo:
        """Alias for get() - returns graph info with nodes/edges."""
        return self.get(graph_id)

    @staticmethod
    def _extract_structure(compiled: CompiledGraph) -> tuple[list[NodeInfo], list[EdgeInfo]]:
        """Extract nodes and edges from a compiled graph via introspection."""
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
            # Skip internal start/end markers, map them to readable IDs
            if source == "__start__":
                source = "__start__"
            if target == "__end__":
                target = "__end__"
            # Only include edges between real nodes or with explicit start/end
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
