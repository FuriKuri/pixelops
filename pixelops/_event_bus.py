from __future__ import annotations

import asyncio

from pixelops._schemas import NodeEvent


class EventBus:
    """Pub/Sub event bus for graph execution events."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue[NodeEvent | None]]] = {}

    def subscribe(self, graph_id: str) -> asyncio.Queue[NodeEvent | None]:
        """Subscribe to events for a graph. Returns a queue to read from."""
        queue: asyncio.Queue[NodeEvent | None] = asyncio.Queue()
        self._subscribers.setdefault(graph_id, []).append(queue)
        return queue

    def unsubscribe(self, graph_id: str, queue: asyncio.Queue[NodeEvent | None]) -> None:
        """Remove a subscriber."""
        if graph_id in self._subscribers:
            self._subscribers[graph_id] = [
                q for q in self._subscribers[graph_id] if q is not queue
            ]

    async def publish(self, graph_id: str, event: NodeEvent) -> None:
        """Publish an event to all subscribers of a graph."""
        for queue in self._subscribers.get(graph_id, []):
            await queue.put(event)

    async def publish_done(self, graph_id: str) -> None:
        """Signal that execution is complete."""
        for queue in self._subscribers.get(graph_id, []):
            await queue.put(None)


# Singleton
event_bus = EventBus()
