from __future__ import annotations

from agentcc import AgentCC

MODEL = "gpt-4o-mini"


def test_streaming_with_tools(client: AgentCC) -> None:
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather in a city.",
                "parameters": {
                    "type": "object",
                    "properties": {"city": {"type": "string"}},
                    "required": ["city"],
                },
            },
        }
    ]
    stream = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": "Weather in Bangalore?"}],
        tools=tools,
        stream=True,
        max_tokens=100,
    )
    chunks = list(stream)
    assert len(chunks) > 0
    saw_tool_call = False
    for c in chunks:
        if c.choices and c.choices[0].delta and getattr(c.choices[0].delta, "tool_calls", None):
            saw_tool_call = True
            break
    assert saw_tool_call


def test_chat_completions_stream_helper(client: AgentCC) -> None:
    with client.chat.completions.stream(
        model="gemini-2.0-flash",
        messages=[{"role": "user", "content": "Say 'hi'."}],
        max_tokens=5,
    ) as stream:
        for _ in stream:
            pass
