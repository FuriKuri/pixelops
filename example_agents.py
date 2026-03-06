"""
PixelOps Example: Content Creation Pipeline with 5 real LLM agents.

A multi-agent system where each agent has a specific role:
  planner → researcher → writer → editor → fact_checker

The editor can send work back to the writer if quality is insufficient.
"""

import os
from typing import Annotated, TypedDict

from dotenv import load_dotenv
load_dotenv()

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

# --- LLM via OpenRouter ---
llm = ChatOpenAI(
    model="google/gemini-2.0-flash-001",
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ["OPENROUTER_API_KEY"],
    temperature=0.7,
    max_tokens=500,
)


# --- State ---
def merge_lists(a: list[str], b: list[str]) -> list[str]:
    return a + b


class PipelineState(TypedDict):
    topic: str
    outline: str
    research: str
    draft: str
    editor_feedback: str
    revision_count: Annotated[list[str], merge_lists]
    fact_check: str
    final_output: str


# --- Agent Nodes ---

def planner(state: PipelineState) -> dict:
    """Creates a content outline based on the topic."""
    response = llm.invoke([
        SystemMessage(content=(
            "You are a content planner. Given a topic, create a brief outline "
            "with 3-4 key sections. Be concise - max 4 bullet points."
        )),
        HumanMessage(content=f"Create an outline for: {state['topic']}"),
    ])
    return {"outline": response.content}


def researcher(state: PipelineState) -> dict:
    """Gathers key facts and data points for the outline."""
    response = llm.invoke([
        SystemMessage(content=(
            "You are a researcher. Given an outline, provide 3-4 key facts or data points "
            "that would strengthen each section. Be specific and concise."
        )),
        HumanMessage(content=f"Research these sections:\n{state['outline']}"),
    ])
    return {"research": response.content}


def writer(state: PipelineState) -> dict:
    """Writes a draft based on outline and research."""
    feedback_context = ""
    if state.get("editor_feedback"):
        feedback_context = f"\n\nEditor feedback to incorporate:\n{state['editor_feedback']}"

    response = llm.invoke([
        SystemMessage(content=(
            "You are a skilled writer. Write a concise, engaging article draft "
            "based on the outline and research provided. Keep it under 200 words."
        )),
        HumanMessage(content=(
            f"Topic: {state['topic']}\n\n"
            f"Outline:\n{state['outline']}\n\n"
            f"Research:\n{state['research']}"
            f"{feedback_context}"
        )),
    ])
    return {"draft": response.content}


def editor(state: PipelineState) -> dict:
    """Reviews the draft and provides feedback or approves it."""
    response = llm.invoke([
        SystemMessage(content=(
            "You are a senior editor. Review this draft for clarity, accuracy, and engagement. "
            "If the draft is good enough, start your response with 'APPROVED:' followed by minor suggestions. "
            "If it needs significant revision, start with 'REVISE:' followed by specific feedback. "
            "Be concise."
        )),
        HumanMessage(content=f"Review this draft:\n\n{state['draft']}"),
    ])
    return {
        "editor_feedback": response.content,
        "revision_count": ["revision"],
    }


def fact_checker(state: PipelineState) -> dict:
    """Verifies claims in the final draft and produces the final output."""
    response = llm.invoke([
        SystemMessage(content=(
            "You are a fact checker. Review this article for any claims that seem "
            "inaccurate or unsupported. Then output the final polished version of the article. "
            "Keep it concise."
        )),
        HumanMessage(content=f"Fact-check and finalize:\n\n{state['draft']}"),
    ])
    return {"fact_check": response.content, "final_output": response.content}


# --- Routing ---

def should_revise(state: PipelineState) -> str:
    """Editor decides: send back to writer or move to fact-checking."""
    feedback = state.get("editor_feedback", "")
    revisions = len(state.get("revision_count", []))

    # Max 1 revision loop to keep it snappy
    if feedback.startswith("REVISE:") and revisions <= 1:
        return "writer"
    return "fact_checker"


# --- Build Graph ---

graph = StateGraph(PipelineState)

graph.add_node("planner", planner)
graph.add_node("researcher", researcher)
graph.add_node("writer", writer)
graph.add_node("editor", editor)
graph.add_node("fact_checker", fact_checker)

graph.add_edge(START, "planner")
graph.add_edge("planner", "researcher")
graph.add_edge("researcher", "writer")
graph.add_edge("writer", "editor")
graph.add_conditional_edges("editor", should_revise, {"writer": "writer", "fact_checker": "fact_checker"})
graph.add_edge("fact_checker", END)

compiled = graph.compile()

# --- Visualize with PixelOps ---

import pixelops

pixelops.visualize(
    ("Content Pipeline", compiled, "5 AI agents: planner → researcher → writer → editor → fact_checker"),
    port=5555,
)
