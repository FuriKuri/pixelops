import json
import time
from collections.abc import AsyncGenerator
from typing import Any

from app.models.schemas import NodeEvent


async def execute_graph(
    compiled_graph: Any,
    input_data: dict,
    config: dict | None = None,
) -> AsyncGenerator[NodeEvent, None]:
    """Execute a compiled LangGraph and yield NodeEvents from astream_events.

    Maps LangGraph events to NodeEvent types:
    - on_chain_start (with langgraph_node) → node_start
    - on_chain_end (with langgraph_node) → node_end
    - on_chat_model_stream → node_progress (token streaming)
    """
    async for event in compiled_graph.astream_events(input_data, config=config or {}, version="v2"):
        kind = event.get("event")
        metadata = event.get("metadata", {})
        node_id = metadata.get("langgraph_node")

        if not node_id:
            continue

        if kind == "on_chain_start" and node_id:
            yield NodeEvent(
                type="node_start",
                node_id=node_id,
                timestamp=time.time(),
                data={
                    "step": metadata.get("langgraph_step", 0),
                    "triggers": metadata.get("langgraph_triggers", []),
                },
            )

        elif kind == "on_chain_end" and node_id:
            output = event.get("data", {}).get("output")
            yield NodeEvent(
                type="node_end",
                node_id=node_id,
                timestamp=time.time(),
                data={
                    "step": metadata.get("langgraph_step", 0),
                    "output": _safe_serialize(output),
                },
            )

        elif kind == "on_chat_model_stream" and node_id:
            chunk = event.get("data", {}).get("chunk")
            content = ""
            if chunk and hasattr(chunk, "content"):
                content = chunk.content
            if content:
                yield NodeEvent(
                    type="node_progress",
                    node_id=node_id,
                    timestamp=time.time(),
                    data={"token": content},
                )


async def format_sse_events(
    compiled_graph: Any,
    input_data: dict,
    config: dict | None = None,
) -> AsyncGenerator[dict, None]:
    """Wrap execute_graph output as SSE-compatible dicts for EventSourceResponse."""
    try:
        async for node_event in execute_graph(compiled_graph, input_data, config):
            yield {
                "event": node_event.type,
                "data": node_event.model_dump_json(),
            }
        # Signal completion
        yield {
            "event": "done",
            "data": json.dumps({"timestamp": time.time()}),
        }
    except Exception as e:
        yield {
            "event": "error",
            "data": json.dumps({"error": str(e), "timestamp": time.time()}),
        }


def _safe_serialize(obj: Any) -> Any:
    """Safely serialize output for JSON, falling back to str."""
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {k: _safe_serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_safe_serialize(v) for v in obj]
    try:
        json.dumps(obj)
        return obj
    except (TypeError, ValueError):
        return str(obj)
