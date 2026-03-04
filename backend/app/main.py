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
    from graphs.research_agent import create_research_agent_graph
    from graphs.multi_agent_team import create_multi_agent_team_graph

    registry.register(
        name="Simple Chat",
        compiled_graph=create_simple_chat_graph(),
        description="A simple input → llm_call → output chat agent",
    )

    registry.register(
        name="Research Agent",
        compiled_graph=create_research_agent_graph(),
        description="Research agent with planner → researcher → writer loop and conditional edges",
    )

    registry.register(
        name="Multi Agent Team",
        compiled_graph=create_multi_agent_team_graph(),
        description="Multi-agent team: supervisor → coder → reviewer → tester → supervisor_final with loop",
    )


_register_graphs()


@app.get("/health")
async def health():
    return {"status": "ok"}
