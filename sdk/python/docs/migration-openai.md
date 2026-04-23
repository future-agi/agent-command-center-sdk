# Migrating from OpenAI to AgentCC

AgentCC is a drop-in replacement for the OpenAI Python SDK. Your existing `client.chat.completions.create()` code works unchanged -- you just route it through the AgentCC gateway to unlock caching, guardrails, fallbacks, cost tracking, and session management.

Pick the approach that fits your codebase.

---

## Approach 1: Base URL Swap

The simplest migration. Change `base_url` and `api_key` on your existing OpenAI client. Zero new dependencies.

### Before (OpenAI)

```python
from openai import OpenAI

client = OpenAI(api_key="sk-openai-...")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
)
print(response.choices[0].message.content)
```

### After (AgentCC via OpenAI client)

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-agentcc-...",                        # AgentCC API key
    base_url="https://gateway.example.com/v1",     # AgentCC gateway URL
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
)
print(response.choices[0].message.content)
```

This works because the AgentCC gateway exposes an OpenAI-compatible HTTP API. All requests are proxied, logged, and enriched with gateway features configured on your org/key.

---

## Approach 2: `create_headers()` -- Keep OpenAI Client, Add AgentCC Features

Use the OpenAI client as-is but inject `x-agentcc-*` headers to control caching, guardrails, sessions, and more on a per-request basis.

### Before (OpenAI)

```python
from openai import OpenAI

client = OpenAI(api_key="sk-openai-...")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Summarize this document"}],
)
```

### After (OpenAI + AgentCC headers)

```python
from openai import OpenAI
import agentcc

# Build headers that enable caching, retries, and session tracking
headers = agentcc.create_headers(
    api_key="sk-agentcc-...",
    config=agentcc.GatewayConfig(
        cache=agentcc.CacheConfig(ttl=300, strategy="semantic"),
        retry=agentcc.RetryConfig(max_retries=3),
        fallback=agentcc.FallbackConfig(targets=[
            agentcc.FallbackTarget(model="gpt-4o-mini"),
            agentcc.FallbackTarget(model="claude-sonnet-4-20250514"),
        ]),
    ),
    session_id="session-abc",
    user_id="user-42",
    trace_id="trace-xyz",
    metadata={"team": "ml-platform", "env": "production"},
)

client = OpenAI(
    base_url="https://gateway.example.com/v1",
    default_headers=headers,
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Summarize this document"}],
)
```

### Available header options

| Parameter             | Header                        | Purpose                                   |
|-----------------------|-------------------------------|-------------------------------------------|
| `api_key`             | `Authorization`               | AgentCC API key                             |
| `trace_id`            | `x-agentcc-trace-id`            | Distributed tracing                       |
| `session_id`          | `x-agentcc-session-id`          | Session grouping                          |
| `session_name`        | `x-agentcc-session-name`        | Human-readable session label              |
| `user_id`             | `x-agentcc-user-id`             | Per-user tracking and budgets             |
| `request_id`          | `x-agentcc-request-id`          | Idempotency / correlation                 |
| `metadata`            | `x-agentcc-metadata`            | Arbitrary JSON metadata                   |
| `cache_ttl`           | `x-agentcc-cache-ttl`           | Cache TTL in seconds                      |
| `cache_namespace`     | `x-agentcc-cache-namespace`     | Cache isolation namespace                 |
| `cache_force_refresh` | `x-agentcc-cache-force-refresh` | Bypass cache for this request             |
| `guardrail_policy`    | `x-agentcc-guardrail-policy`    | Guardrail policy IDs (comma-separated)    |
| `properties`          | `x-agentcc-property-{key}`      | Custom key-value properties               |
| `config`              | `x-agentcc-config`              | Full GatewayConfig as JSON                |

---

## Approach 3: `patch_openai()` -- Auto-Patch Existing OpenAI Client

One-line migration. `patch_openai()` returns a AgentCC client that has the exact same `client.chat.completions.create()` interface as OpenAI.

### Before (OpenAI)

```python
from openai import OpenAI

client = OpenAI(api_key="sk-openai-...")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

### After (AgentCC via `patch_openai`)

```python
from agentcc import patch_openai

client = patch_openai(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
)

# Exact same API -- no code changes downstream
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

`patch_openai()` accepts all the same parameters as `AgentCC()`, so you can configure everything up front:

```python
from agentcc import patch_openai, GatewayConfig, CacheConfig, RetryConfig
from agentcc.callbacks import LoggingCallback, MetricsCallback

metrics = MetricsCallback()

client = patch_openai(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    max_retries=3,
    config=GatewayConfig(
        cache=CacheConfig(ttl=600, strategy="semantic"),
        retry=RetryConfig(max_retries=3, backoff_factor=0.5),
    ),
    callbacks=[LoggingCallback(), metrics],
    session_id="onboarding-flow",
    metadata={"env": "staging"},
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)

# Access AgentCC-specific features
print(f"Total cost: ${client.current_cost:.4f}")
print(f"Avg latency: {metrics.avg_latency:.0f}ms")
```

---

## What AgentCC Adds Over Raw OpenAI

### Caching

```python
from agentcc import AgentCC, GatewayConfig, CacheConfig

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        cache=CacheConfig(
            enabled=True,
            strategy="semantic",       # "exact" or "semantic"
            ttl=300,                    # 5 minutes
            namespace="prod-v2",
            semantic_threshold=0.92,
        ),
    ),
)
```

### Guardrails

```python
from agentcc import AgentCC, GatewayConfig, GuardrailConfig, GuardrailCheck

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        guardrails=GuardrailConfig(
            checks=[
                GuardrailCheck(name="pii_detection", action="mask"),
                GuardrailCheck(name="toxicity", action="block", confidence_threshold=0.9),
                GuardrailCheck(name="prompt_injection", action="block"),
            ],
            pipeline_mode="parallel",
            timeout_ms=500,
        ),
    ),
)
```

### Automatic Fallbacks

```python
from agentcc import AgentCC, GatewayConfig, FallbackConfig, FallbackTarget

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        fallback=FallbackConfig(
            targets=[
                FallbackTarget(model="gpt-4o-mini"),
                FallbackTarget(model="claude-sonnet-4-20250514", provider="anthropic"),
            ],
            on_status_codes=[429, 500, 502, 503, 504],
        ),
    ),
)
```

### Cost Tracking

```python
from agentcc import AgentCC, completion_cost, completion_cost_from_response

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)

# Gateway-reported cost (most accurate)
cost = completion_cost_from_response(response)

# Or estimate locally
cost = completion_cost("gpt-4o", prompt_tokens=50, completion_tokens=100)

# Cumulative cost across all calls
print(f"Session total: ${client.current_cost:.4f}")
client.reset_cost()
```

### Sessions

```python
from agentcc import AgentCC

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

with client.session(name="research-task") as sess:
    sess.step("search")
    client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Search for recent papers on RLHF"}],
    )

    sess.step("summarize")
    client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Summarize the findings"}],
    )
# All requests in this block are grouped under the same session
```

---

## Streaming

Streaming works identically to OpenAI.

### Before (OpenAI)

```python
from openai import OpenAI

client = OpenAI(api_key="sk-openai-...")

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a poem"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### After (AgentCC)

```python
from agentcc import AgentCC

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a poem"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

---

## Async

### Before (OpenAI)

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key="sk-openai-...")

response = await client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

### After (AgentCC)

```python
from agentcc import AsyncAgentCC

client = AsyncAgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

response = await client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

---

## Environment Variables

Instead of passing keys inline, set environment variables:

| OpenAI              | AgentCC                  |
|---------------------|------------------------|
| `OPENAI_API_KEY`    | `AGENTCC_API_KEY`        |
| `OPENAI_BASE_URL`   | `AGENTCC_BASE_URL`       |
| --                  | `AGENTCC_ADMIN_TOKEN`    |
| --                  | `AGENTCC_CONTROL_PLANE_URL` |

```python
# With env vars set, no arguments needed
from agentcc import AgentCC
client = AgentCC()
```

---

## Quick Reference

| OpenAI SDK                              | AgentCC SDK                                       |
|-----------------------------------------|-------------------------------------------------|
| `from openai import OpenAI`             | `from agentcc import AgentCC`                       |
| `from openai import AsyncOpenAI`        | `from agentcc import AsyncAgentCC`                  |
| `OpenAI(api_key=...)`                   | `AgentCC(api_key=..., base_url=...)`              |
| `client.chat.completions.create(...)`   | `client.chat.completions.create(...)`           |
| `client.embeddings.create(...)`         | `client.embeddings.create(...)`                 |
| `client.images.generate(...)`           | `client.images.generate(...)`                   |
| `client.audio.transcriptions.create(...)` | `client.audio.transcriptions.create(...)`     |
| `client.moderations.create(...)`        | `client.moderations.create(...)`                |
| --                                      | `client.feedback.create(...)`                   |
| --                                      | `client.prompts.list()`                         |
| --                                      | `client.logs.list()`                            |
| --                                      | `client.session(name=...)`                      |
| --                                      | `client.current_cost`                           |
| --                                      | `client.gateway.health()`                       |
