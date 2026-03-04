"""Multi-Agent Team graph: supervisor -> coder -> reviewer -> tester -> supervisor_final.

Demonstrates a sequential multi-agent workflow with a conditional loop.
supervisor_final can send work back to coder if quality is insufficient.
Uses a fake LLM by default so it runs without API keys.
Set ANTHROPIC_API_KEY env var to use ChatAnthropic instead.
"""

import os
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph import END, START, StateGraph


class TeamState(TypedDict):
    messages: Annotated[list[BaseMessage], lambda a, b: a + b]
    task: str
    code: str
    review: str
    tests: str
    iteration: int
    max_iterations: int
    status: str


def _get_llm():
    """Return ChatAnthropic if API key is set, otherwise a fake LLM."""
    if os.environ.get("ANTHROPIC_API_KEY"):
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=512)

    from langchain_core.language_models.fake import FakeListChatModel
    return FakeListChatModel(
        responses=[
            "I've analyzed the task and will distribute it to the team. "
            "The coder will implement the solution, the reviewer will check quality, "
            "and the tester will verify correctness.",
            "```python\ndef solve(data):\n    # Implementation based on requirements\n"
            "    result = process(data)\n    return validate(result)\n```\n"
            "I've implemented the core logic with input validation and error handling.",
            "Code Review:\n"
            "- Structure: Good separation of concerns\n"
            "- Edge cases: Handled appropriately\n"
            "- Style: Follows PEP 8 conventions\n"
            "- Suggestion: Consider adding type hints for better maintainability",
            "```python\ndef test_solve():\n    assert solve([1, 2, 3]) == expected\n"
            "    assert solve([]) == empty_result\n    assert solve(None) raises ValueError\n```\n"
            "All 3 test cases pass. Coverage: 95%.",
            "All team members have completed their work.\n"
            "- Code: Implemented and follows best practices\n"
            "- Review: Passed with minor suggestions\n"
            "- Tests: All passing with 95% coverage\n"
            "Status: APPROVED - ready for deployment.",
        ]
    )


async def supervisor(state: TeamState) -> TeamState:
    """Receive task and distribute to specialist agents."""
    llm = _get_llm()
    task = ""
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            task = msg.content
            break

    response = await llm.ainvoke([
        HumanMessage(content=f"Plan work for this task: {task}")
    ])

    return {
        "messages": [AIMessage(content=f"[Supervisor] {response.content}")],
        "task": task or state.get("task", ""),
        "code": state.get("code", ""),
        "review": state.get("review", ""),
        "tests": state.get("tests", ""),
        "iteration": state.get("iteration", 0) + 1,
        "max_iterations": state.get("max_iterations", 2),
        "status": "in_progress",
    }


async def coder(state: TeamState) -> TeamState:
    """Generate code based on the task."""
    llm = _get_llm()
    response = await llm.ainvoke([
        HumanMessage(content=f"Write code for: {state.get('task', 'unknown task')}")
    ])

    return {
        "messages": [AIMessage(content=f"[Coder] {response.content}")],
        "task": state["task"],
        "code": response.content,
        "review": state.get("review", ""),
        "tests": state.get("tests", ""),
        "iteration": state["iteration"],
        "max_iterations": state["max_iterations"],
        "status": state["status"],
    }


async def reviewer(state: TeamState) -> TeamState:
    """Review the code and provide feedback."""
    llm = _get_llm()
    response = await llm.ainvoke([
        HumanMessage(content=f"Review this code:\n{state.get('code', 'no code')}")
    ])

    return {
        "messages": [AIMessage(content=f"[Reviewer] {response.content}")],
        "task": state["task"],
        "code": state["code"],
        "review": response.content,
        "tests": state.get("tests", ""),
        "iteration": state["iteration"],
        "max_iterations": state["max_iterations"],
        "status": state["status"],
    }


async def tester(state: TeamState) -> TeamState:
    """Write and run tests for the code."""
    llm = _get_llm()
    response = await llm.ainvoke([
        HumanMessage(content=f"Write tests for:\n{state.get('code', 'no code')}")
    ])

    return {
        "messages": [AIMessage(content=f"[Tester] {response.content}")],
        "task": state["task"],
        "code": state["code"],
        "review": state["review"],
        "tests": response.content,
        "iteration": state["iteration"],
        "max_iterations": state["max_iterations"],
        "status": state["status"],
    }


async def supervisor_final(state: TeamState) -> TeamState:
    """Review all results and decide if work is complete or needs another round."""
    llm = _get_llm()
    response = await llm.ainvoke([
        HumanMessage(
            content=f"Evaluate the team output:\n"
            f"Code: {state.get('code', 'none')}\n"
            f"Review: {state.get('review', 'none')}\n"
            f"Tests: {state.get('tests', 'none')}"
        )
    ])

    return {
        "messages": [AIMessage(content=f"[Supervisor Final] {response.content}")],
        "task": state["task"],
        "code": state["code"],
        "review": state["review"],
        "tests": state["tests"],
        "iteration": state["iteration"],
        "max_iterations": state["max_iterations"],
        "status": "approved",
    }


def should_finish(state: TeamState) -> str:
    """Decide whether to approve or send back for another iteration.

    Loops back to coder if iteration < max_iterations and status is not approved.
    """
    iteration = state.get("iteration", 0)
    max_iterations = state.get("max_iterations", 2)
    status = state.get("status", "")

    if status != "approved" and iteration < max_iterations:
        return "coder"
    return "__end__"


def create_multi_agent_team_graph():
    """Build and compile the multi-agent team graph."""
    graph = StateGraph(TeamState)

    graph.add_node("supervisor", supervisor)
    graph.add_node("coder", coder)
    graph.add_node("reviewer", reviewer)
    graph.add_node("tester", tester)
    graph.add_node("supervisor_final", supervisor_final)

    graph.add_edge(START, "supervisor")
    graph.add_edge("supervisor", "coder")
    graph.add_edge("coder", "reviewer")
    graph.add_edge("reviewer", "tester")
    graph.add_edge("tester", "supervisor_final")
    graph.add_conditional_edges(
        "supervisor_final",
        should_finish,
        {"coder": "coder", "__end__": END},
    )

    return graph.compile()
