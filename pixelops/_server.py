from __future__ import annotations

import webbrowser
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from pixelops._registry import registry
from pixelops._routes import router

STATIC_DIR = Path(__file__).parent / "static"


def create_app() -> FastAPI:
    app = FastAPI(title="PixelOps")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:*", "http://127.0.0.1:*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)

    # Serve frontend static files
    if STATIC_DIR.exists():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

        @app.get("/{path:path}")
        async def spa_fallback(path: str):
            """Serve index.html for all non-API routes (SPA routing)."""
            file = (STATIC_DIR / path).resolve()
            if file.is_file() and str(file).startswith(str(STATIC_DIR.resolve())):
                return FileResponse(file)
            return FileResponse(STATIC_DIR / "index.html")

    return app


def serve(
    *graphs: Any,
    port: int = 5555,
    host: str = "127.0.0.1",
    open_browser: bool = True,
) -> None:
    """Register graphs and start the PixelOps server.

    Args:
        *graphs: Compiled LangGraph graphs. Each can be:
            - A compiled graph (auto-named "Graph 1", "Graph 2", ...)
            - A (name, compiled_graph) tuple
            - A (name, compiled_graph, description) tuple
        port: Server port (default: 5555)
        host: Server host (default: 127.0.0.1)
        open_browser: Open browser automatically (default: True)
    """
    for i, g in enumerate(graphs):
        if isinstance(g, tuple):
            if len(g) == 2:
                name, compiled = g
                registry.register(name=name, compiled_graph=compiled)
            elif len(g) == 3:
                name, compiled, desc = g
                registry.register(name=name, compiled_graph=compiled, description=desc)
            else:
                raise ValueError(f"Expected (name, graph) or (name, graph, description) tuple, got {len(g)} elements")
        else:
            registry.register(name=f"Graph {i + 1}", compiled_graph=g)

    app = create_app()

    if open_browser:
        import threading
        threading.Timer(1.0, lambda: webbrowser.open(f"http://{host}:{port}")).start()

    print(f"\n  PixelOps running at http://{host}:{port}\n")
    uvicorn.run(app, host=host, port=port, log_level="info")
