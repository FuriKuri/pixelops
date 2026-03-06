from __future__ import annotations

import webbrowser
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from pixelops._registry import registry
from pixelops._routes import router

STATIC_DIR = Path(__file__).parent / "static"


def create_app(base_path: str = "") -> FastAPI:
    """Create the PixelOps FastAPI app.

    Args:
        base_path: URL prefix when mounted as sub-app (e.g. "/pixelops").
                   Empty string for standalone mode.
    """
    # Strip trailing slash for consistent path joining
    base_path = base_path.rstrip("/")

    app = FastAPI(title="PixelOps", root_path=base_path)
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
        assets_dir = STATIC_DIR / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/")
        async def serve_index() -> HTMLResponse:
            """Serve index.html with injected base path."""
            html = (STATIC_DIR / "index.html").read_text()
            # Inject base path as global variable for the JS bundle
            inject = f'<script>window.__PIXELOPS_BASE__="{base_path}";</script>'
            html = html.replace("</head>", f"{inject}</head>")
            # Fix absolute asset paths to include base_path
            if base_path:
                html = html.replace('src="/assets/', f'src="{base_path}/assets/')
                html = html.replace('href="/assets/', f'href="{base_path}/assets/')
                html = html.replace('href="/vite.svg"', f'href="{base_path}/vite.svg"')
            return HTMLResponse(html)

        @app.get("/{path:path}", response_model=None)
        async def spa_fallback(path: str) -> FileResponse | HTMLResponse:
            """Serve static files or fall back to index.html for SPA routing."""
            file = (STATIC_DIR / path).resolve()
            if file.is_file() and str(file).startswith(str(STATIC_DIR.resolve())):
                return FileResponse(file)
            # SPA fallback – serve index.html with base path injected
            return await serve_index()

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
