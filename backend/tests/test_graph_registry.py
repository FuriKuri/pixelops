import pytest
from app.graph.registry import GraphRegistry
from app.models.schemas import GraphInfo


def test_register_returns_id(registry: GraphRegistry) -> None:
    """register() returns a valid graph ID."""
    assert "simple_chat" in [g.id for g in registry.list()]


def test_list_contains_graph(registry: GraphRegistry) -> None:
    """list() returns the registered graph."""
    graphs = registry.list()
    assert len(graphs) == 1
    assert graphs[0].id == "simple_chat"
    assert graphs[0].name == "Simple Chat"


def test_get_returns_graph_info(registry: GraphRegistry) -> None:
    """get() returns a GraphInfo with correct fields."""
    info = registry.get("simple_chat")
    assert isinstance(info, GraphInfo)
    assert info.id == "simple_chat"
    assert info.name == "Simple Chat"
    assert info.description == "Demo chat graph"


def test_get_structure_has_nodes_and_edges(registry: GraphRegistry) -> None:
    """get_structure() returns nodes and edges."""
    info = registry.get_structure("simple_chat")
    assert len(info.nodes) > 0, "Graph must have at least one node"
    assert len(info.edges) > 0, "Graph must have at least one edge"


def test_get_structure_node_ids(registry: GraphRegistry) -> None:
    """Nodes have expected IDs for the simple_chat graph."""
    info = registry.get_structure("simple_chat")
    node_ids = {n.id for n in info.nodes}
    assert "input" in node_ids
    assert "llm_call" in node_ids
    assert "output" in node_ids


def test_get_compiled_returns_graph(registry: GraphRegistry) -> None:
    """get_compiled() returns a callable compiled graph."""
    compiled = registry.get_compiled("simple_chat")
    assert compiled is not None
    assert hasattr(compiled, "astream_events")


def test_get_missing_graph_raises(registry: GraphRegistry) -> None:
    """get() raises KeyError for unknown graph IDs."""
    with pytest.raises(KeyError):
        registry.get("nonexistent_graph")


def test_register_multiple(registry: GraphRegistry) -> None:
    """Multiple graphs can be registered independently."""
    from graphs.simple_chat import create_simple_chat_graph
    graph2 = create_simple_chat_graph()
    registry.register(name="Second Graph", compiled_graph=graph2, description="")
    assert len(registry.list()) == 2
