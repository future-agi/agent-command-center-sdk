"""Basic chat completion with the AgentCC SDK.

Demonstrates creating a AgentCC client and making a simple chat completion
request.  The API is identical to the OpenAI SDK so migration is seamless.
"""

import os

from agentcc import AgentCC

# Configuration from environment (with safe defaults for local dev)
API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")

# Create the client -- same interface as openai.OpenAI()
client = AgentCC(api_key=API_KEY, base_url=BASE_URL)

# Make a chat completion request
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"},
    ],
    temperature=0.7,
    max_tokens=256,
)

# Print the response
print("Model:", response.model)
print("Content:", response.choices[0].message.content)
print("Finish reason:", response.choices[0].finish_reason)

# Usage stats are included in every response
if response.usage:
    print(f"Tokens: {response.usage.prompt_tokens} prompt + "
          f"{response.usage.completion_tokens} completion = "
          f"{response.usage.total_tokens} total")

# AgentCC-specific metadata (provider, cost, latency) is available on .agentcc
if hasattr(response, "agentcc") and response.agentcc:
    print(f"Provider: {response.agentcc.provider}")
    print(f"Latency: {response.agentcc.latency_ms}ms")
    if response.agentcc.cost is not None:
        print(f"Cost: ${response.agentcc.cost:.6f}")

# The client tracks cumulative cost across all calls
print(f"Cumulative cost: ${client.current_cost:.6f}")

# Clean up
client.close()
