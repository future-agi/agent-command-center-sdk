# Migrating from Portkey to AgentCC

AgentCC and Portkey share a similar architecture: an LLM gateway that sits between your app and providers, with an SDK that sends configuration via headers. If you are already using Portkey, the migration to AgentCC is straightforward. This guide covers every major Portkey feature and its AgentCC equivalent.

---

## Client Initialization

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk-...",
    virtual_key="openai-key-abc",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

### AgentCC

```python
from agentcc import AgentCC

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

Key differences:
- AgentCC requires an explicit `base_url` (or `AGENTCC_BASE_URL` env var) pointing to your gateway.
- Provider API keys are managed in the AgentCC control plane, not via virtual keys in the SDK. The gateway routes to the correct provider based on your org config and the model name.
- Both SDKs use the OpenAI-compatible `client.chat.completions.create()` interface.

---

## Config Objects

Portkey uses a `Config` object for routing, retries, and caching. AgentCC uses `GatewayConfig` with typed sub-config dataclasses.

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk-...",
    config={
        "strategy": {"mode": "fallback"},
        "targets": [
            {"virtual_key": "openai-key", "override_params": {"model": "gpt-4o"}},
            {"virtual_key": "anthropic-key", "override_params": {"model": "claude-sonnet-4-20250514"}},
        ],
        "cache": {"mode": "semantic", "max_age": 300},
        "retry": {"attempts": 3, "on_status_codes": [429, 500]},
    },
)
```

### AgentCC

```python
from agentcc import (
    AgentCC,
    GatewayConfig,
    FallbackConfig,
    FallbackTarget,
    CacheConfig,
    RetryConfig,
)

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        fallback=FallbackConfig(
            targets=[
                FallbackTarget(model="gpt-4o"),
                FallbackTarget(model="claude-sonnet-4-20250514", provider="anthropic"),
            ],
            on_status_codes=[429, 500, 502, 503, 504],
        ),
        cache=CacheConfig(
            strategy="semantic",
            ttl=300,
            semantic_threshold=0.92,
        ),
        retry=RetryConfig(
            max_retries=3,
            on_status_codes=[429, 500],
            backoff_factor=0.5,
        ),
    ),
)
```

AgentCC's `GatewayConfig` is a typed dataclass with IDE autocomplete and validation. The full list of sub-configs:

| Sub-config                 | Purpose                                           |
|----------------------------|---------------------------------------------------|
| `FallbackConfig`           | Automatic model/provider fallback                 |
| `LoadBalanceConfig`        | Round-robin, weighted, least-latency routing      |
| `CacheConfig`              | Exact or semantic response caching                |
| `GuardrailConfig`          | Input/output safety checks                        |
| `ConditionalRoutingConfig` | Rule-based routing (metadata, headers)            |
| `TrafficMirrorConfig`      | Shadow traffic to a second model                  |
| `RetryConfig`              | Retry with backoff, jitter, Retry-After           |
| `TimeoutConfig`            | Granular connect/read/write/total timeouts        |

The config serializes to `x-prism-*` headers automatically via `config.to_headers()`.

---

## Virtual Keys

Portkey uses virtual keys to abstract provider API keys. AgentCC manages provider credentials at the control plane level.

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk-...",
    virtual_key="openai-virtual-key-abc",
)
```

### AgentCC

```python
from agentcc import AgentCC

# Provider keys are configured in the AgentCC control plane (Django admin).
# The gateway resolves them based on org config and model name.
client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
)

# To manage keys programmatically:
keys = client.keys.list()
client.keys.create(name="openai-prod", provider="openai", key="sk-...")
```

In AgentCC, your single `api_key` authenticates to the gateway. The gateway maps models to provider credentials from the org config, so you never expose raw provider keys in application code.

---

## Guardrails

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk-...",
    virtual_key="openai-key",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    guardrails=["pii-detection", "toxicity-check"],
)
```

### AgentCC

```python
from agentcc import AgentCC, GatewayConfig, GuardrailConfig, GuardrailCheck

# Option 1: Simple policy IDs
client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        guardrails=GuardrailConfig(
            input_guardrails=["pii-detection"],
            output_guardrails=["toxicity-check"],
            deny=True,  # block on violation (vs. warn)
        ),
    ),
)

# Option 2: Structured checks with per-check configuration
client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        guardrails=GuardrailConfig(
            checks=[
                GuardrailCheck(
                    name="pii_detection",
                    action="mask",               # "block", "warn", "mask", "log"
                    confidence_threshold=0.85,
                ),
                GuardrailCheck(
                    name="toxicity",
                    action="block",
                    confidence_threshold=0.9,
                ),
                GuardrailCheck(
                    name="prompt_injection",
                    action="block",
                ),
            ],
            pipeline_mode="parallel",  # run checks in parallel
            fail_open=False,           # block if guardrail service is down
            timeout_ms=500,            # max guardrail latency
        ),
    ),
)
```

Handle guardrail responses:

```python
from agentcc import AgentCC, GuardrailBlockedError, GuardrailWarning

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

try:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "..."}],
    )
except GuardrailBlockedError as e:
    # HTTP 446 -- request was blocked
    print(f"Blocked: {e}")
except GuardrailWarning as e:
    # HTTP 246 -- warning, response still returned
    print(f"Warning: {e}")
```

AgentCC guardrails run in a Python sidecar with Llama Guard, Prompt Guard, and custom models. The gateway calls the sidecar via gRPC for sub-100ms checks.

---

## Feedback

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(api_key="pk-...")

client.feedback.create(
    trace_id="trace-abc",
    value=1,
    weight=1.0,
)
```

### AgentCC

```python
from agentcc import AgentCC

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

client.feedback.create(
    trace_id="trace-abc",
    value=1,
    weight=1.0,
    metadata={"reviewer": "user-42", "reason": "accurate response"},
)
```

Both SDKs expose `client.feedback.create()`. AgentCC also supports arbitrary metadata on feedback submissions.

---

## Prompts Management

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(api_key="pk-...")

# Get a prompt template
prompt = client.prompts.retrieve(prompt_id="pp-abc")

# Render and complete
response = client.prompts.completions.create(
    prompt_id="pp-abc",
    variables={"topic": "quantum computing"},
)
```

### AgentCC

```python
from agentcc import AgentCC

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

# List prompt templates
prompts = client.prompts.list()

# Retrieve a specific prompt
prompt = client.prompts.retrieve(prompt_id="pp-abc")

# Use the prompt in a completion (render variables, then call)
rendered = client.prompts.render(
    prompt_id="pp-abc",
    variables={"topic": "quantum computing"},
)
response = client.chat.completions.create(
    model="gpt-4o",
    messages=rendered,
)
```

Prompts are managed in the AgentCC control plane (Django dashboard) and retrieved by the SDK at call time.

---

## Tracing and Logging

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk-...",
    trace_id="trace-abc",
    metadata={"user": "user-42", "env": "production"},
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

### AgentCC

```python
from agentcc import AgentCC

# Set trace_id and metadata at the client level
client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    session_id="session-abc",
    metadata={"user": "user-42", "env": "production"},
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)

# Or use create_headers() for per-request tracing with any OpenAI client
import agentcc

headers = agentcc.create_headers(
    trace_id="trace-abc",
    session_id="session-abc",
    user_id="user-42",
    metadata={"env": "production"},
    request_id="req-unique-123",
)
```

AgentCC also provides structured session tracking:

```python
from agentcc import AgentCC

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

with client.session(name="customer-support-flow") as sess:
    sess.step("classify")
    response1 = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Classify this ticket"}],
    )

    sess.step("respond")
    response2 = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Draft a response"}],
    )
# All requests in this block share the same session for end-to-end tracing
```

Query logs programmatically:

```python
logs = client.logs.list(
    session_id="session-abc",
    limit=50,
)
```

### Callbacks for custom logging

```python
from agentcc import AgentCC
from agentcc.callbacks import CallbackHandler, CallbackRequest, CallbackResponse

class DatadogCallback(CallbackHandler):
    def on_request_end(self, request: CallbackRequest, response: CallbackResponse):
        # Send metrics to your observability platform
        statsd.increment("llm.requests")
        statsd.histogram("llm.latency", response.agentcc.latency_ms)
        statsd.histogram("llm.cost", response.agentcc.cost)

    def on_error(self, request: CallbackRequest, error: Exception):
        statsd.increment("llm.errors")

    def on_cache_hit(self, request, response, cache_type):
        statsd.increment("llm.cache_hits", tags=[f"type:{cache_type}"])

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    callbacks=[DatadogCallback()],
)
```

---

## Caching

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk-...",
    virtual_key="openai-key",
    config={
        "cache": {"mode": "semantic", "max_age": 300},
    },
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What is quantum computing?"}],
)

# Check if cached
if response._headers.get("x-portkey-cache-status") == "HIT":
    print("Cache hit!")
```

### AgentCC

```python
from agentcc import AgentCC, GatewayConfig, CacheConfig

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        cache=CacheConfig(
            enabled=True,
            strategy="semantic",           # "exact" or "semantic"
            ttl=300,                        # seconds
            namespace="prod-v2",            # isolate cache by namespace
            semantic_threshold=0.92,        # similarity threshold for semantic cache
            cache_by_model=True,            # separate cache per model
            force_refresh=False,            # set True to bypass cache for one request
        ),
    ),
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What is quantum computing?"}],
)
```

Per-request cache control using `create_headers()`:

```python
import agentcc

# Force bypass cache for a single request
headers = agentcc.create_headers(
    cache_ttl=600,
    cache_namespace="experiment-a",
    cache_force_refresh=True,
)
```

Cache callbacks:

```python
from agentcc.callbacks import CallbackHandler

class CacheMonitor(CallbackHandler):
    def on_cache_hit(self, request, response, cache_type):
        print(f"Cache HIT ({cache_type}) -- saved ${response.agentcc.cost}")

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(cache=CacheConfig(strategy="semantic", ttl=300)),
    callbacks=[CacheMonitor()],
)
```

---

## Load Balancing

### Portkey

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk-...",
    config={
        "strategy": {"mode": "loadbalance"},
        "targets": [
            {"virtual_key": "openai-key-1", "weight": 0.7},
            {"virtual_key": "openai-key-2", "weight": 0.3},
        ],
    },
)
```

### AgentCC

```python
from agentcc import AgentCC, GatewayConfig, LoadBalanceConfig, LoadBalanceTarget

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        load_balance=LoadBalanceConfig(
            strategy="weighted",  # "round_robin", "weighted", "least_latency", "cost_optimized"
            targets=[
                LoadBalanceTarget(model="gpt-4o", provider="openai", weight=0.7),
                LoadBalanceTarget(model="gpt-4o", provider="azure", weight=0.3),
            ],
        ),
    ),
)
```

AgentCC supports four load balancing strategies compared to Portkey's single mode:
- `round_robin` -- even distribution
- `weighted` -- proportional to weight values
- `least_latency` -- route to the fastest provider
- `cost_optimized` -- route to the cheapest provider

---

## Quick Reference

| Portkey                                  | AgentCC                                                 |
|------------------------------------------|-------------------------------------------------------|
| `from portkey_ai import Portkey`         | `from agentcc import AgentCC`                             |
| `Portkey(api_key=...)`                   | `AgentCC(api_key=..., base_url=...)`                    |
| `virtual_key="key-abc"`                  | Keys managed in control plane                         |
| `config={"cache": {...}}`                | `config=GatewayConfig(cache=CacheConfig(...))`        |
| `config={"retry": {...}}`                | `config=GatewayConfig(retry=RetryConfig(...))`        |
| `config={"strategy": {"mode": "..."}}`   | `FallbackConfig(...)` or `LoadBalanceConfig(...)`     |
| `client.feedback.create(...)`            | `client.feedback.create(...)`                         |
| `client.prompts.retrieve(...)`           | `client.prompts.retrieve(...)`                        |
| `trace_id="abc"`                         | `session_id="abc"` or `create_headers(trace_id="abc")`|
| `metadata={...}`                         | `metadata={...}`                                      |
| `guardrails=[...]`                       | `GuardrailConfig(checks=[GuardrailCheck(...)])`       |
| `x-portkey-cache-status`                 | `on_cache_hit` callback or `response.agentcc` metadata  |
| `PORTKEY_API_KEY`                        | `AGENTCC_API_KEY`                                       |
| `PORTKEY_BASE_URL`                       | `AGENTCC_BASE_URL`                                      |

### Environment Variables

| Portkey               | AgentCC                      |
|-----------------------|----------------------------|
| `PORTKEY_API_KEY`     | `AGENTCC_API_KEY`            |
| `PORTKEY_BASE_URL`    | `AGENTCC_BASE_URL`           |
| --                    | `AGENTCC_ADMIN_TOKEN`        |
| --                    | `AGENTCC_CONTROL_PLANE_URL`  |
