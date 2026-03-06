from __future__ import annotations

import json
import time
from typing import Any

from pixelops._event_bus import event_bus
from pixelops._schemas import NodeEvent


_seen_starts: dict[str, set[tuple[str, int]]] = {}
_seen_ends: dict[str, set[tuple[str, int]]] = {}


def _reset_tracking(graph_id: str) -> None:
    _seen_starts.pop(graph_id, None)
    _seen_ends.pop(graph_id, None)


async def emit_event(graph_id: str, raw_event: dict[str, Any]) -> None:
    """Convert a raw LangGraph astream_events event and publish to PixelOps.

    Usage::

        async for event in graph.astream_events(input, version="v2"):
            await pixelops.emit_event("my_graph", event)
    """
    kind = raw_event.get("event")
    metadata = raw_event.get("metadata", {})
    node_id = metadata.get("langgraph_node")

    if not node_id:
        return

    step = metadata.get("langgraph_step", 0)

    if kind == "on_chain_start":
        key = (node_id, step)
        seen = _seen_starts.setdefault(graph_id, set())
        if key in seen:
            return
        seen.add(key)
        await event_bus.publish(graph_id, NodeEvent(
            type="node_start",
            node_id=node_id,
            timestamp=time.time(),
            data={
                "step": step,
                "triggers": metadata.get("langgraph_triggers", []),
            },
        ))

    elif kind == "on_chain_end":
        key = (node_id, step)
        seen = _seen_ends.setdefault(graph_id, set())
        if key in seen:
            return
        seen.add(key)
        output = raw_event.get("data", {}).get("output")
        await event_bus.publish(graph_id, NodeEvent(
            type="node_end",
            node_id=node_id,
            timestamp=time.time(),
            data={
                "step": step,
                "output": _safe_serialize(output),
            },
        ))

    elif kind == "on_chat_model_stream":
        chunk = raw_event.get("data", {}).get("chunk")
        content = ""
        if chunk and hasattr(chunk, "content"):
            content = chunk.content
        if content:
            await event_bus.publish(graph_id, NodeEvent(
                type="node_progress",
                node_id=node_id,
                timestamp=time.time(),
                data={"token": content},
            ))


async def emit_done(graph_id: str) -> None:
    """Signal that execution is complete. Resets dedup tracking."""
    await event_bus.publish_done(graph_id)
    _reset_tracking(graph_id)


def _safe_serialize(obj: Any) -> Any:
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
