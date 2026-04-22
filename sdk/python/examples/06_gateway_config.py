"""Gateway configuration with fallback, cache, guardrails, and retry.

Demonstrates using GatewayConfig to set per-request gateway behavior.
Config objects serialize to x-agentcc-* HTTP headers that the AgentCC Gateway
interprets on the hot path.  Priority: request header > per-key > per-org > global.
"""

import os

from agentcc import (
    CacheConfig,
    FallbackConfig,
    FallbackTarget,
    GatewayConfig,
    GuardrailConfig,
    AgentCC,
    RetryConfig,
    TimeoutConfig,
    create_headers,
)

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")

# Build a gateway config with multiple features
config = GatewayConfig(
    # Automatic fallback: if gpt-4o fails, try gpt-4o-mini
    fallback=FallbackConfig(
        targets=[
            FallbackTarget(model="gpt-4o-mini"),
            FallbackTarget(model="claude-3-5-sonnet-20241022", provider="anthropic"),
        ],
        on_status_codes=[429, 500, 502, 503, 504],
    ),
    # Response caching: cache identical requests for 5 minutes
    cache=CacheConfig(
        enabled=True,
        strategy="exact",       # "exact" or "semantic"
        ttl=300,                # seconds
        namespace="prod",
    ),
    # Input/output guardrails
    guardrails=GuardrailConfig(
        input_guardrails=["pii-detection", "prompt-injection"],
        output_guardrails=["toxicity-check"],
        deny=True,              # block (not just warn) on violation
    ),
    # Retry policy
    retry=RetryConfig(max_retries=3, on_status_codes=[429, 500, 502, 503]),
    # Granular timeouts
    timeout=TimeoutConfig(connect=5.0, read=30.0, total=60.0),
)

# Inspect the generated headers
headers = config.to_headers()
print("Generated headers:")
for key, value in sorted(headers.items()):
    print(f"  {key}: {value}")

# Pass config directly to the client (applied to all requests)
client = AgentCC(api_key=API_KEY, base_url=BASE_URL, config=config)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
    max_tokens=50,
)
print(f"\nResponse: {response.choices[0].message.content}")

# Alternatively, use create_headers() with any OpenAI-compatible client
print("\n=== create_headers() for OpenAI SDK ===")
hdrs = create_headers(
    api_key=API_KEY,
    config=config,
    trace_id="trace-123",
    user_id="user-42",
    metadata={"env": "production", "team": "ml"},
)
for key, value in sorted(hdrs.items()):
    print(f"  {key}: {value}")

client.close()
