# agentcc

Python SDK for the AgentCC gateway — OpenAI-compatible, typed, with first-class streaming, tools, structured output, guardrails, and cost tracking.

## Install

```bash
pip install agentcc
```

Python 3.9+ required.

## Usage

### Basic chat completion

```python
import os
from agentcc import AgentCC

client = AgentCC(
    api_key=os.environ["AGENTCC_API_KEY"],
    base_url="https://gateway.futureagi.com/v1",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Summarize the theory of relativity."}],
)
print(response.choices[0].message.content)
```

The `AgentCC` client reads `AGENTCC_API_KEY` and `AGENTCC_BASE_URL` from the environment when those parameters are not passed explicitly.

### Streaming

```python
# stream=True returns an iterator of ChatCompletionChunk objects
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a haiku about programming."}],
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta
    if delta.content:
        print(delta.content, end="", flush=True)

# Alternatively, use the stream() context manager for convenience helpers
with client.chat.completions.stream(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a haiku about programming."}],
) as s:
    for text in s.text_stream:
        print(text, end="", flush=True)
    print(f"\n[{s.get_final_completion().usage.total_tokens} tokens]")
```

### Tool calling

```python
import json

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a location.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]

messages = [{"role": "user", "content": "What's the weather in Paris?"}]
response = client.chat.completions.create(model="gpt-4o", messages=messages, tools=tools)

if response.choices[0].message.tool_calls:
    for tc in response.choices[0].message.tool_calls:
        args = json.loads(tc.function.arguments)
        # call your function, then send the result back as a tool message
```

### Async client

```python
import asyncio
from agentcc import AsyncAgentCC

async def main():
    client = AsyncAgentCC(
        api_key=os.environ["AGENTCC_API_KEY"],
        base_url="https://gateway.futureagi.com/v1",
    )
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello!"}],
    )
    print(response.choices[0].message.content)
    await client.close()

asyncio.run(main())
```

## API surface

| Resource | Access path |
|---|---|
| Chat completions | `client.chat.completions` |
| Legacy completions | `client.completions` |
| Embeddings | `client.embeddings` |
| Images | `client.images` |
| Audio | `client.audio` |
| Models | `client.models` |
| Moderations | `client.moderations` |
| Files | `client.files` |
| Batches | `client.batches` |
| Rerank | `client.rerank` |
| Responses | `client.responses` |

## Environment variables

| Variable | Description |
|---|---|
| `AGENTCC_API_KEY` | API key (`sk-agentcc-*`) |
| `AGENTCC_BASE_URL` | Gateway base URL (e.g. `https://gateway.futureagi.com/v1`) |

## Documentation

[https://docs.futureagi.com](https://docs.futureagi.com)

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
