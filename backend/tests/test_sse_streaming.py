"""End-to-end SSE streaming tests.

Runs the FastAPI app in-process using httpx.AsyncClient and validates
that the SSE event stream emits well-formed node_start / node_end events
in the correct order.
"""

import json

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

RUN_URL = "/api/graphs/simple_chat/run"
RUN_BODY = {"input": {"messages": [{"role": "user", "content": "hello"}]}}


def _parse_sse(raw: str) -> list[dict]:
    """Parse a raw SSE text body into a list of {event, data} dicts."""
    events = []
    current: dict = {}
    for line in raw.splitlines():
        if line.startswith("event:"):
            current["event"] = line[len("event:"):].strip()
        elif line.startswith("data:"):
            current["data"] = line[len("data:"):].strip()
        elif line == "" and current:
            events.append(current)
            current = {}
    if current:
        events.append(current)
    return events


@pytest.mark.asyncio
async def test_run_returns_event_stream() -> None:
    """POST /run returns content-type text/event-stream."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        async with client.stream("POST", RUN_URL, json=RUN_BODY) as resp:
            assert resp.status_code == 200
            content_type = resp.headers.get("content-type", "")
            assert "text/event-stream" in content_type


@pytest.mark.asyncio
async def test_node_start_before_node_end() -> None:
    """Every node_start event is followed by a corresponding node_end."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        async with client.stream("POST", RUN_URL, json=RUN_BODY) as resp:
            raw = await resp.aread()

    events = _parse_sse(raw.decode())
    event_types = [e.get("event") for e in events]

    starts = [e for e in events if e.get("event") == "node_start"]
    ends = [e for e in events if e.get("event") == "node_end"]

    assert len(starts) > 0, f"No node_start events found. Got: {event_types}"
    assert len(ends) > 0, f"No node_end events found. Got: {event_types}"

    # Each start should precede a matching end
    start_ids = [json.loads(e["data"])["node_id"] for e in starts]
    end_ids = [json.loads(e["data"])["node_id"] for e in ends]
    for nid in start_ids:
        assert nid in end_ids, f"node_start for '{nid}' has no matching node_end"

    # Globally: first node_start index < last node_end index
    first_start = next(i for i, e in enumerate(events) if e.get("event") == "node_start")
    last_end = max(i for i, e in enumerate(events) if e.get("event") == "node_end")
    assert first_start < last_end


@pytest.mark.asyncio
async def test_stream_ends_with_terminal_event() -> None:
    """Stream ends with a terminal event (done, interrupt, or error)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        async with client.stream("POST", RUN_URL, json=RUN_BODY) as resp:
            raw = await resp.aread()

    events = _parse_sse(raw.decode())
    event_types = [e.get("event") for e in events]
    terminal_events = {"done", "interrupt", "error"}
    has_terminal = any(t in terminal_events for t in event_types)
    assert has_terminal, f"No terminal event found. Got: {event_types}"
    # The last event must be the terminal one
    assert event_types[-1] in terminal_events, f"Last event is not terminal: {event_types}"


@pytest.mark.asyncio
async def test_node_events_have_valid_structure() -> None:
    """node_start and node_end events contain required fields."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        async with client.stream("POST", RUN_URL, json=RUN_BODY) as resp:
            raw = await resp.aread()

    events = _parse_sse(raw.decode())
    node_events = [e for e in events if e.get("event") in ("node_start", "node_end")]

    for e in node_events:
        data = json.loads(e["data"])
        assert "node_id" in data, f"Missing node_id in {data}"
        assert "timestamp" in data, f"Missing timestamp in {data}"
        assert "type" in data, f"Missing type in {data}"


@pytest.mark.asyncio
async def test_unknown_graph_returns_404() -> None:
    """POST /run for an unknown graph_id returns 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/graphs/does_not_exist/run", json=RUN_BODY)
    assert resp.status_code == 404
