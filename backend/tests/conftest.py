import pytest
from app.graph.registry import GraphRegistry
from graphs.simple_chat import create_simple_chat_graph


@pytest.fixture
def registry() -> GraphRegistry:
    """Fresh registry with the demo graph registered."""
    reg = GraphRegistry()
    graph = create_simple_chat_graph()
    reg.register(name="Simple Chat", compiled_graph=graph, description="Demo chat graph")
    return reg


@pytest.fixture
def demo_graph_id() -> str:
    return "simple_chat"
