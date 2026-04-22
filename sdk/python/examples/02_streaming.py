"""Streaming chat completions with the AgentCC SDK.

Demonstrates two approaches to streaming:
1. Using stream=True in create() for low-level chunk iteration
2. Using the stream() context manager for convenience helpers
"""

import os

from agentcc import AgentCC

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")

client = AgentCC(api_key=API_KEY, base_url=BASE_URL)
messages = [{"role": "user", "content": "Write a haiku about programming."}]

# ---- Approach 1: stream=True (returns a Stream iterator) ----
print("=== Approach 1: stream=True ===")
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    stream=True,
)
# Iterate over raw ChatCompletionChunk objects
for chunk in stream:
    delta = chunk.choices[0].delta
    if delta.content:
        print(delta.content, end="", flush=True)
print("\n")

# ---- Approach 2: stream() context manager (returns StreamManager) ----
print("=== Approach 2: stream() context manager ===")
with client.chat.completions.stream(
    model="gpt-4o",
    messages=messages,
) as stream:
    # text_stream yields only the text content (no parsing needed)
    for text in stream.text_stream:
        print(text, end="", flush=True)

    # After consuming the stream, get the full reassembled completion
    completion = stream.get_final_completion()
    print(f"\n\nFull text: {stream.get_final_text()}")
    if completion.usage:
        print(f"Total tokens: {completion.usage.total_tokens}")

# ---- Approach 3: StreamManager event iterator ----
print("\n=== Approach 3: Event iterator ===")
with client.chat.completions.stream(
    model="gpt-4o",
    messages=messages,
) as stream:
    for event in stream:
        if event.type == "content":
            print(event.text, end="", flush=True)
        elif event.type == "usage":
            print(f"\n[usage: {event.usage.total_tokens} tokens]")
        elif event.type == "done":
            print("[stream complete]")

client.close()
