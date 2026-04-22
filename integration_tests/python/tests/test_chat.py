"""Chat completions: sync, streaming, tool calling, structured output."""
from __future__ import annotations

import pytest
from pydantic import BaseModel

from agentcc import AgentCC, AsyncAgentCC

MODEL = "gemini-2.0-flash"


def test_sync_completion(client: AgentCC) -> None:
    result = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": "Reply with only: hi"}],
        max_tokens=5,
    )
    assert result.choices[0].message.content
    assert result.agentcc is not None
    assert result.agentcc.request_id


def test_streaming_completion(client: AgentCC) -> None:
    stream = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": "Count to 3, comma-separated."}],
        stream=True,
        max_tokens=20,
    )
    chunks = list(stream)
    assert len(chunks) > 0
    text = "".join(c.choices[0].delta.content or "" for c in chunks if c.choices)
    assert len(text) > 0


def test_tool_calling(client: AgentCC) -> None:
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get the current weather in a given city.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string"},
                    },
                    "required": ["city"],
                },
            },
        }
    ]
    result = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": "What's the weather in Bangalore?"}],
        tools=tools,
        max_tokens=100,
    )
    msg = result.choices[0].message
    assert msg.tool_calls is not None and len(msg.tool_calls) > 0
    tc = msg.tool_calls[0]
    assert tc.function.name == "get_weather"


def test_structured_output(client: AgentCC) -> None:
    class Person(BaseModel):
        name: str
        age: int

    result = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "user", "content": "Alice is 30. Respond as JSON: {name, age}."}
        ],
        response_format={"type": "json_object"},
        max_tokens=50,
    )
    content = result.choices[0].message.content
    assert content and "Alice" in content


async def test_async_completion(async_client: AsyncAgentCC) -> None:
    result = await async_client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": "Say 'ok'."}],
        max_tokens=5,
    )
    assert result.choices[0].message.content
    assert result.agentcc is not None


async def test_async_streaming(async_client: AsyncAgentCC) -> None:
    stream = await async_client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": "Say 'hi'."}],
        stream=True,
        max_tokens=5,
    )
    chunks = [c async for c in stream]
    assert len(chunks) > 0
    await async_client.aclose()
