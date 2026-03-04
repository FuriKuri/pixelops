"""Research Agent graph: planner -> researcher -> writer with conditional loop.

Demonstrates conditional edges and loops in LangGraph.
Uses a fake LLM by default so it runs without API keys.
Set ANTHROPIC_API_KEY env var to use ChatAnthropic instead.
"""

import os
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph import END, START, StateGraph


class ResearchState(TypedDict):
    messages: Annotated[list[BaseMessage], lambda a, b: a + b]
    search_terms: list[str]
    research_results: list[str]
    iteration: int
    max_iterations: int


def _get_llm():
    """Return ChatAnthropic if API key is set, otherwise a fake LLM."""
    if os.environ.get("ANTHROPIC_API_KEY"):
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=512)

    from langchain_core.language_models.fake import FakeListChatModel
    return FakeListChatModel(
        responses=[
            "Based on the question, I'll research these topics:\n"
            "1. Core concepts and definitions\n"
            "2. Recent developments and trends\n"
            "3. Practical applications and examples",
            "Here are the research findings:\n"
            "- Finding 1: The topic has significant relevance in current literature.\n"
            "- Finding 2: Multiple approaches exist, each with trade-offs.\n"
            "- Finding 3: Experts recommend a balanced methodology.",
            "## Research Summary\n\n"
            "Based on the analysis of available sources, here is a comprehensive answer:\n\n"
            "The research indicates that this topic is multifaceted. "
            "Key takeaways include the importance of structured approaches, "
            "the value of iterative refinement, and the need for practical validation. "
            "Further investigation may be warranted for edge cases.",
        ]
    )


async def planner(state: ResearchState) -> ResearchState:
    """Analyze the question and create a research plan with search terms."""
    llm = _get_llm()
    question = ""
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            question = msg.content
            break

    response = await llm.ainvoke([
        HumanMessage(content=f"Create a research plan for: {question}")
    ])

    search_terms = [
        f"{question} - overview",
        f"{question} - recent developments",
        f"{question} - practical applications",
    ]

    return {
        "messages": [AIMessage(content=f"[Planner] {response.content}")],
        "search_terms": search_terms,
        "research_results": state.get("research_results", []),
        "iteration": state.get("iteration", 0) + 1,
        "max_iterations": state.get("max_iterations", 2),
    }


async def researcher(state: ResearchState) -> ResearchState:
    """Simulate web research based on the search terms."""
    llm = _get_llm()
    terms = state.get("search_terms", [])

    response = await llm.ainvoke([
        HumanMessage(content=f"Research these topics: {', '.join(terms)}")
    ])

    new_results = state.get("research_results", []) + [response.content]

    return {
        "messages": [AIMessage(content=f"[Researcher] {response.content}")],
        "search_terms": terms,
        "research_results": new_results,
        "iteration": state["iteration"],
        "max_iterations": state["max_iterations"],
    }


def should_continue_research(state: ResearchState) -> str:
    """Decide whether to loop back to planner or proceed to writer.

    Goes back to planner if:
    - Less than 2 research results AND iteration < max_iterations
    """
    results = state.get("research_results", [])
    iteration = state.get("iteration", 0)
    max_iterations = state.get("max_iterations", 2)

    if len(results) < 2 and iteration < max_iterations:
        return "planner"
    return "writer"


async def writer(state: ResearchState) -> ResearchState:
    """Synthesize research results into a final answer."""
    llm = _get_llm()
    results = state.get("research_results", [])

    response = await llm.ainvoke([
        HumanMessage(
            content=f"Write a summary based on these findings:\n"
            + "\n".join(results)
        )
    ])

    return {
        "messages": [AIMessage(content=f"[Writer] {response.content}")],
        "search_terms": state.get("search_terms", []),
        "research_results": results,
        "iteration": state["iteration"],
        "max_iterations": state["max_iterations"],
    }


def create_research_agent_graph():
    """Build and compile the research agent graph with conditional loop."""
    graph = StateGraph(ResearchState)

    graph.add_node("planner", planner)
    graph.add_node("researcher", researcher)
    graph.add_node("writer", writer)

    graph.add_edge(START, "planner")
    graph.add_edge("planner", "researcher")
    graph.add_conditional_edges(
        "researcher",
        should_continue_research,
        {"planner": "planner", "writer": "writer"},
    )
    graph.add_edge("writer", END)

    return graph.compile()
