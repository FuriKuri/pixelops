from __future__ import annotations

from collections import defaultdict, deque

from pixelops._schemas import EdgeInfo, GraphInfo, LayoutData, NodeInfo, Position

DESK_SPACING_X = 6
DESK_SPACING_Y = 5
MARGIN = 2


def generate_layout(graph: GraphInfo) -> LayoutData:
    if not graph.nodes:
        return LayoutData(width=10, height=10)

    layers = _topological_layers(graph.nodes, graph.edges)

    max_layer_width = max(len(layer) for layer in layers) if layers else 1
    grid_width = MARGIN * 2 + max_layer_width * DESK_SPACING_X
    grid_height = MARGIN * 2 + len(layers) * DESK_SPACING_Y

    node_positions: dict[str, Position] = {}
    for layer_idx, layer in enumerate(layers):
        y = MARGIN + layer_idx * DESK_SPACING_Y
        total_width = (len(layer) - 1) * DESK_SPACING_X
        start_x = MARGIN + (grid_width - 2 * MARGIN - total_width) // 2
        for node_idx, node_id in enumerate(layer):
            x = start_x + node_idx * DESK_SPACING_X
            node_positions[node_id] = Position(x=x, y=y)

    return LayoutData(width=grid_width, height=grid_height, node_positions=node_positions)


def _topological_layers(nodes: list[NodeInfo], edges: list[EdgeInfo]) -> list[list[str]]:
    node_ids = {n.id for n in nodes}
    adj: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {n: 0 for n in node_ids}

    for edge in edges:
        src, tgt = edge.source, edge.target
        if src not in node_ids or tgt not in node_ids:
            continue
        adj[src].append(tgt)
        in_degree[tgt] += 1

    queue = deque(n for n, d in in_degree.items() if d == 0)
    layers: list[list[str]] = []
    visited: set[str] = set()

    while queue:
        layer = list(queue)
        layers.append(layer)
        next_queue: deque[str] = deque()
        for node in layer:
            visited.add(node)
            for neighbor in adj[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0 and neighbor not in visited:
                    next_queue.append(neighbor)
        queue = next_queue

    remaining = [n for n in node_ids if n not in visited]
    if remaining:
        layers.append(remaining)

    return layers
