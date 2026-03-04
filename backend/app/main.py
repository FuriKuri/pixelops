from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.graph import registry

app = FastAPI(title="PixelOps", description="Pixel-Art visualization for LangGraph agents")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


def _register_graphs() -> None:
    """Register all demo/built-in graphs at startup."""
    from graphs.simple_chat import create_simple_chat_graph

    registry.register(
        name="Simple Chat",
        compiled_graph=create_simple_chat_graph(),
        description="A simple input → llm_call → output chat agent",
    )


_register_graphs()


@app.get("/health")
async def health():
    return {"status": "ok"}
