import pytest
from app.graph.layout_generator import generate_layout
from app.models.schemas import EdgeInfo, GraphInfo, NodeInfo, Position


def _make_graph(nodes: list[tuple[str, str]], edges: list[tuple[str, str]]) -> GraphInfo:
    """Helper: build a GraphInfo from simple node/edge tuples."""
    return GraphInfo(
        id="test",
        name="Test Graph",
        nodes=[NodeInfo(id=nid, name=name) for nid, name in nodes],
        edges=[EdgeInfo(source=src, target=tgt) for src, tgt in edges],
    )


def test_every_node_gets_position() -> None:
    """All nodes receive a position in the layout."""
    graph = _make_graph(
        nodes=[("a", "A"), ("b", "B"), ("c", "C")],
        edges=[("a", "b"), ("b", "c")],
    )
    layout = generate_layout(graph)
    assert set(layout.node_positions.keys()) == {"a", "b", "c"}


def test_no_overlapping_positions() -> None:
    """No two nodes share the same (x, y) position."""
    graph = _make_graph(
        nodes=[("a", "A"), ("b", "B"), ("c", "C"), ("d", "D")],
        edges=[("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")],
    )
    layout = generate_layout(graph)
    positions = list(layout.node_positions.values())
    coords = [(p.x, p.y) for p in positions]
    assert len(coords) == len(set(coords)), f"Overlapping positions: {coords}"


def test_grid_dimensions_positive() -> None:
    """Layout dimensions are positive."""
    graph = _make_graph(
        nodes=[("a", "A"), ("b", "B")],
        edges=[("a", "b")],
    )
    layout = generate_layout(graph)
    assert layout.width > 0
    assert layout.height > 0


def test_empty_graph_returns_default_layout() -> None:
    """Empty graphs return a default non-zero layout."""
    graph = GraphInfo(id="empty", name="Empty", nodes=[], edges=[])
    layout = generate_layout(graph)
    assert layout.width > 0
    assert layout.height > 0
    assert layout.node_positions == {}


def test_single_node_layout() -> None:
    """Single node gets a position."""
    graph = _make_graph(nodes=[("only", "Only")], edges=[])
    layout = generate_layout(graph)
    assert "only" in layout.node_positions
    pos = layout.node_positions["only"]
    assert isinstance(pos, Position)
    assert pos.x >= 0
    assert pos.y >= 0


def test_linear_chain_layers() -> None:
    """In a linear chain a→b→c, nodes appear in different y-layers."""
    graph = _make_graph(
        nodes=[("a", "A"), ("b", "B"), ("c", "C")],
        edges=[("a", "b"), ("b", "c")],
    )
    layout = generate_layout(graph)
    ya = layout.node_positions["a"].y
    yb = layout.node_positions["b"].y
    yc = layout.node_positions["c"].y
    assert ya < yb < yc, f"Expected layered y-coords, got a={ya} b={yb} c={yc}"
