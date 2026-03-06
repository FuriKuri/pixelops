# PixelOps

Watch your LangGraph agents come to life as pixel characters in a virtual office.

## Features

- Real-time pixel art visualization of LangGraph agent workflows
- SSE-powered live streaming of agent execution events
- Interactive office environment with pathfinding and animations
- Human-in-the-loop support with visual interrupt handling
- Pan, zoom and explore the virtual office

## Quick Start

```bash
# Install from GitHub
pip install git+https://github.com/FuriKuri/pixelops.git

# Or install locally for development
git clone git@github.com:FuriKuri/pixelops.git && cd pixelops
pip install -e .
```

```python
import pixelops

# Pass your compiled LangGraph graph(s)
pixelops.visualize(
    ("My Pipeline", compiled_graph, "Description of the pipeline"),
    port=5555,
)
# Opens http://127.0.0.1:5555 in your browser
```

See `example_agents.py` for a full working example with 5 LLM agents.

## Architecture

```
Browser <-> React UI <-> Canvas 2D Engine
               |
              SSE
               |
         pixelops (FastAPI) <-> LangGraph <-> LLM
```

The `pixelops` Python package embeds a FastAPI server that serves both the API and the pre-built frontend. No separate backend or frontend setup needed.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend UI | React 19, TypeScript, Tailwind CSS |
| Canvas Engine | Canvas 2D API, custom game loop |
| State Management | Zustand |
| Backend API | FastAPI, Python 3.10+ |
| Agent Framework | LangGraph, LangChain |
| Streaming | Server-Sent Events (SSE) |

## License

MIT
