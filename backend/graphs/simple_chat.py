"""Simple chat graph: input → llm_call → output.

Uses a fake LLM by default so it runs without API keys.
Set ANTHROPIC_API_KEY env var to use ChatAnthropic instead.
"""

import os
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph import END, START, StateGraph


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], lambda a, b: a + b]


def _get_llm():
    """Return ChatAnthropic if API key is set, otherwise a fake LLM."""
    if os.environ.get("ANTHROPIC_API_KEY"):
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=256)

    from langchain_core.language_models.fake import FakeListChatModel
    return FakeListChatModel(
        responses=[
            "Hello! I'm a demo agent running in PixelOps. "
            "I can see your message and I'm responding from the llm_call node. "
            "This is a fake LLM response for testing the visualization pipeline."
        ]
    )


async def input_node(state: ChatState) -> ChatState:
    """Pass through input messages."""
    return {"messages": []}


async def llm_call(state: ChatState) -> ChatState:
    """Call the LLM with the conversation history."""
    llm = _get_llm()
    response = await llm.ainvoke(state["messages"])
    return {"messages": [response]}


async def output_node(state: ChatState) -> ChatState:
    """Pass through the final response."""
    return {"messages": []}


def create_simple_chat_graph():
    """Build and compile the simple chat graph."""
    graph = StateGraph(ChatState)

    graph.add_node("input", input_node)
    graph.add_node("llm_call", llm_call)
    graph.add_node("output", output_node)

    graph.add_edge(START, "input")
    graph.add_edge("input", "llm_call")
    graph.add_edge("llm_call", "output")
    graph.add_edge("output", END)

    return graph.compile()
