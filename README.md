# PixelOps

Watch your LangGraph agents come to life as pixel characters in a virtual office.

![PixelOps](docs/screenshot.png)

## Features

- Real-time pixel art visualization of LangGraph agent workflows
- SSE-powered live streaming of agent execution events
- Interactive office environment with pathfinding and animations
- Human-in-the-loop support with visual interrupt handling
- Pan, zoom and explore the virtual office
- Multiple demo graphs included (Simple Chat, Research Agent, Multi-Agent Team)

## Quick Start

```bash
git clone <repo-url> && cd pixelops

# Backend
cd backend && pip install -r requirements.txt
cp .env.example .env  # Optional: add ANTHROPIC_API_KEY
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Open http://localhost:5173
```

## Architecture

```
Browser <-> React UI <-> Canvas 2D Engine
               |
              SSE
               |
FastAPI <-> LangGraph <-> LLM (Anthropic/Fake)
```

## Adding Custom Graphs

1. Create a new graph module in `backend/app/graphs/` implementing the `BaseGraph` interface.
2. Register your graph in `backend/app/graphs/__init__.py` so the API picks it up automatically.
3. Define node positions in the graph's `layout()` method to control how characters appear in the office.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend UI | React 19, TypeScript, Tailwind CSS |
| Canvas Engine | Canvas 2D API, custom game loop |
| State Management | Zustand |
| Backend API | FastAPI, Python 3.12 |
| Agent Framework | LangGraph, LangChain |
| Streaming | Server-Sent Events (SSE) |
| LLM | Anthropic Claude (or fake LLM for demos) |

## License

MIT
