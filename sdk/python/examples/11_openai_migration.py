"""Migrating from OpenAI to AgentCC — two approaches.

Demonstrates how to switch from the openai package to AgentCC with
minimal code changes.  Both approaches give you access to AgentCC gateway
features (caching, guardrails, fallback, etc.) on top of any provider.
"""

import os

# ---- Approach 1: patch_openai() — one-line migration ----
# Replace `from openai import OpenAI` with patch_openai().
# The returned client has the exact same API as openai.OpenAI().

from agentcc import patch_openai

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")

# Before (OpenAI):
#   from openai import OpenAI
#   client = OpenAI(api_key="sk-...")
#
# After (AgentCC):
client = patch_openai(api_key=API_KEY, base_url=BASE_URL)

# All existing code works unchanged
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello from AgentCC!"}],
    max_tokens=50,
)
print(f"[patch_openai] {response.choices[0].message.content}")
client.close()


# ---- Approach 2: create_headers() — keep the openai package ----
# If you want to keep using `openai.OpenAI` directly but route through
# the AgentCC gateway, use create_headers() to build the required headers.

from agentcc import (
    CacheConfig,
    GatewayConfig,
    RetryConfig,
    create_headers,
)

headers = create_headers(
    api_key=API_KEY,
    config=GatewayConfig(
        cache=CacheConfig(ttl=300, namespace="prod"),
        retry=RetryConfig(max_retries=3),
    ),
    trace_id="migration-demo-001",
    session_id="sess-abc",
    user_id="user-42",
    metadata={"source": "migration-example"},
)

print("\n[create_headers] Generated headers:")
for key, value in sorted(headers.items()):
    print(f"  {key}: {value}")

# Use with the official openai package:
#
#   from openai import OpenAI
#
#   client = OpenAI(
#       base_url="http://localhost:8090/v1",
#       default_headers=headers,
#       api_key=API_KEY,
#   )
#   response = client.chat.completions.create(
#       model="gpt-4o",
#       messages=[{"role": "user", "content": "Hello via OpenAI SDK + AgentCC!"}],
#   )
#
# This way your code stays on the openai package but gains AgentCC features:
# caching, guardrails, fallback, tracing, cost tracking, and more.
