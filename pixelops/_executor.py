from __future__ import annotations

import asyncio
import json
import logging
import time
import traceback
from collections.abc import AsyncGenerator
from typing import Any

MAX_RETRIES = 3
RETRY_DELAYS = [1.0, 2.0, 4.0]

from pixelops._schemas import NodeEvent

logger = logging.getLogger(__name__)


async def execute_graph(
    compiled_graph: Any,
    input_data: dict,
    config: dict | None = None,
) -> AsyncGenerator[NodeEvent, None]:
    seen_starts: set[tuple[str, int]] = set()
    seen_ends: set[tuple[str, int]] = set()

    async for event in compiled_graph.astream_events(input_data, config=config or {}, version="v2"):
        kind = event.get("event")
        metadata = event.get("metadata", {})
        node_id = metadata.get("langgraph_node")

        if not node_id:
            continue

        step = metadata.get("langgraph_step", 0)

        if kind == "on_chain_start" and node_id:
            key = (node_id, step)
            if key in seen_starts:
                continue
            seen_starts.add(key)
            yield NodeEvent(
                type="node_start",
                node_id=node_id,
                timestamp=time.time(),
                data={
                    "step": step,
                    "triggers": metadata.get("langgraph_triggers", []),
                },
            )
        elif kind == "on_chain_end" and node_id:
            key = (node_id, step)
            if key in seen_ends:
                continue
            seen_ends.add(key)
            output = event.get("data", {}).get("output")
            yield NodeEvent(
                type="node_end",
                node_id=node_id,
                timestamp=time.time(),
                data={
                    "step": step,
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
    for attempt in range(MAX_RETRIES + 1):
        try:
            async for node_event in execute_graph(compiled_graph, input_data, config):
                yield {
                    "event": node_event.type,
                    "data": node_event.model_dump_json(),
                }
            try:
                state = await compiled_graph.aget_state(config or {})
                if state and state.next:
                    yield {
                        "event": "interrupt",
                        "data": json.dumps({
                            "waiting_for": list(state.next),
                            "timestamp": time.time(),
                        }),
                    }
                else:
                    yield {
                        "event": "done",
                        "data": json.dumps({"timestamp": time.time()}),
                    }
            except Exception:
                yield {
                    "event": "done",
                    "data": json.dumps({"timestamp": time.time()}),
                }
            return  # success, stop retrying
        except Exception as e:
            if attempt < MAX_RETRIES:
                delay = RETRY_DELAYS[attempt]
                logger.warning(
                    "Graph execution error (attempt %d/%d), retrying in %.1fs: %s",
                    attempt + 1, MAX_RETRIES + 1, delay, e,
                )
                yield {
                    "event": "node_progress",
                    "data": json.dumps({
                        "type": "node_progress",
                        "node_id": "__system__",
                        "timestamp": time.time(),
                        "data": {"token": f"[Retry {attempt + 1}/{MAX_RETRIES}] "},
                    }),
                }
                await asyncio.sleep(delay)
            else:
                logger.error("Graph execution error: %s\n%s", e, traceback.format_exc())
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "Graph execution failed", "timestamp": time.time()}),
                }


async def resume_graph(
    compiled_graph: Any,
    user_input: Any,
    config: dict | None = None,
) -> AsyncGenerator[dict, None]:
    from langgraph.types import Command

    command = Command(resume=user_input)
    try:
        async for node_event in execute_graph(compiled_graph, command, config):
            yield {
                "event": node_event.type,
                "data": node_event.model_dump_json(),
            }
        try:
            state = await compiled_graph.aget_state(config or {})
            if state and state.next:
                yield {
                    "event": "interrupt",
                    "data": json.dumps({
                        "waiting_for": list(state.next),
                        "timestamp": time.time(),
                    }),
                }
            else:
                yield {
                    "event": "done",
                    "data": json.dumps({"timestamp": time.time()}),
                }
        except Exception:
            yield {
                "event": "done",
                "data": json.dumps({"timestamp": time.time()}),
            }
    except Exception as e:
        logger.error("Graph resume error: %s\n%s", e, traceback.format_exc())
        yield {
            "event": "error",
            "data": json.dumps({"error": "Graph execution failed", "timestamp": time.time()}),
        }


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
