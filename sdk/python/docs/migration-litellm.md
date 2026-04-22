# Migrating from LiteLLM to AgentCC

AgentCC provides the same multi-provider abstraction as LiteLLM but runs it in a high-performance Go gateway (~11us overhead) rather than in-process Python. This guide covers every major LiteLLM feature and its AgentCC equivalent.

---

## Client Initialization

### LiteLLM

```python
import litellm

# LiteLLM uses module-level functions
response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

### AgentCC

```python
from agentcc import AgentCC

# AgentCC uses a client instance (connection pooling, cost tracking, sessions)
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
- LiteLLM is a module-level function (`litellm.completion()`). AgentCC uses an explicit client object.
- Provider routing happens in the Go gateway, not in Python. You send `model="gpt-4o"` and the gateway routes to the right provider based on your org config.
- The AgentCC client manages connection pools, cost accumulators, and session state.

---

## Streaming

### LiteLLM

```python
import litellm

response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a story"}],
    stream=True,
)
for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

### AgentCC

```python
from agentcc import AgentCC

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a story"}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")
```

Async streaming:

```python
from agentcc import AsyncAgentCC

client = AsyncAgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

stream = await client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a story"}],
    stream=True,
)
async for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")
```

---

## Token Counting

### LiteLLM

```python
import litellm

# Count tokens for text
count = litellm.token_counter(model="gpt-4o", text="Hello world")

# Count tokens for messages
count = litellm.token_counter(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello world"}],
)

# Encode / decode
tokens = litellm.encode(model="gpt-4o", text="Hello world")
text = litellm.decode(model="gpt-4o", tokens=[9906, 1917])

# Get context window
max_tokens = litellm.get_max_tokens("gpt-4o")
```

### AgentCC

```python
import agentcc

# Count tokens for text
count = agentcc.token_counter(model="gpt-4o", text="Hello world")

# Count tokens for messages
count = agentcc.token_counter(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello world"}],
)

# Encode / decode
tokens = agentcc.encode(model="gpt-4o", text="Hello world")
text = agentcc.decode(model="gpt-4o", tokens=[9906, 1917])

# Get context window
max_tokens = agentcc.get_max_tokens("gpt-4o")

# Also available
max_output = agentcc.get_max_output_tokens("gpt-4o")
```

The API is nearly identical. Both use `tiktoken` under the hood with a character-based fallback.

AgentCC also provides `trim_messages()` to auto-trim conversation history to fit a model's context window:

```python
trimmed = agentcc.trim_messages(
    messages=long_conversation,
    model="gpt-4o",
    trim_ratio=0.75,  # use 75% of context window
)
```

---

## Cost Tracking

### LiteLLM

```python
import litellm

response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)

# Per-request cost
cost = litellm.completion_cost(completion_response=response)

# Or estimate from token counts
cost = litellm.completion_cost(
    model="gpt-4o",
    prompt_tokens=50,
    completion_tokens=100,
)
```

### AgentCC

```python
import agentcc
from agentcc import AgentCC

client = AgentCC(api_key="sk-agentcc-...", base_url="https://gateway.example.com")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)

# From response (uses gateway-reported cost if available, falls back to estimation)
cost = agentcc.completion_cost_from_response(response)

# Or estimate from token counts
cost = agentcc.completion_cost(
    model="gpt-4o",
    prompt_tokens=50,
    completion_tokens=100,
)

# Cumulative cost tracking (automatic, no setup needed)
print(f"Total spend: ${client.current_cost:.4f}")
client.reset_cost()
```

AgentCC advantage: `completion_cost_from_response()` first checks `response.agentcc.cost` for the actual cost reported by the gateway (including cache savings, negotiated rates), falling back to local estimation only when unavailable.

---

## Retries

### LiteLLM

```python
import litellm

litellm.num_retries = 3

response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    num_retries=3,
)
```

### AgentCC

```python
from agentcc import AgentCC, GatewayConfig, RetryConfig

# Client-level retries (SDK retries before giving up)
client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    max_retries=3,
)

# Gateway-level retries (gateway retries upstream providers)
client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    config=GatewayConfig(
        retry=RetryConfig(
            max_retries=3,
            on_status_codes=[429, 500, 502, 503],
            backoff_factor=0.5,
            backoff_max=30.0,
            backoff_jitter=0.25,
            respect_retry_after=True,
        ),
    ),
)
```

AgentCC has two retry layers:
1. **SDK retries** (`max_retries` on the client) -- retries the request to the AgentCC gateway.
2. **Gateway retries** (`RetryConfig` in the config) -- the Go gateway retries upstream providers with exponential backoff, jitter, and Retry-After header support. This is faster and more reliable since it happens at the gateway without a Python round-trip.

---

## Budgets

### LiteLLM

```python
from litellm import BudgetManager

budget = BudgetManager(project_name="my-app")
budget.create_budget(
    total_budget=10.0,
    user="user-1",
    duration="daily",
)

if budget.get_current_cost(user="user-1") < budget.get_total_budget(user="user-1"):
    response = litellm.completion(...)
    budget.update_cost(
        user="user-1",
        completion_obj=response,
    )
```

### AgentCC

```python
from agentcc import BudgetManager

budget = BudgetManager(
    max_budget=10.0,     # $10 global budget
    window="1d",         # rolling daily window
)

# Per-user budgets
budget.set_user_budget("user-1", 5.0)  # $5 for this user

# Check before calling (raises AgentCCError if over budget)
budget.check_budget(estimated_cost=0.05, user="user-1")

# Record actual cost after the call
budget.update_cost(cost=0.03, user="user-1")

# Query state
print(budget.get_current_spend(user="user-1"))    # $0.03
print(budget.get_remaining_budget(user="user-1"))  # $4.97
print(budget.projected_cost(hours=24))             # projected daily spend

# Check user validity (has budget and hasn't exceeded it)
budget.is_valid_user("user-1")  # True

# Reset
budget.reset(user="user-1")
```

Key differences:
- AgentCC's `BudgetManager` is a dataclass -- no external storage or project names needed.
- Rolling windows use duration strings: `"5m"`, `"1h"`, `"1d"`, `"1w"`, `"1M"`.
- Thread-safe by default (internal lock).
- `check_budget()` raises `AgentCCError` -- no manual if-else needed.
- `projected_cost()` estimates future spend based on current rate.

---

## Callbacks

### LiteLLM

```python
import litellm

class MyCallback(litellm.Logging):
    def log_pre_api_call(self, model, messages, kwargs):
        print(f"Calling {model}")

    def log_success_event(self, kwargs, response_obj, start_time, end_time):
        print(f"Success: {response_obj.model}")

    def log_failure_event(self, kwargs, response_obj, start_time, end_time):
        print(f"Failure")

litellm.callbacks = [MyCallback()]
```

### AgentCC

```python
from agentcc import AgentCC
from agentcc.callbacks import CallbackHandler, CallbackRequest, CallbackResponse

class MyCallback(CallbackHandler):
    def on_request_start(self, request: CallbackRequest):
        print(f"Calling {request.url}")

    def on_request_end(self, request: CallbackRequest, response: CallbackResponse):
        print(f"Success: status={response.status_code}, cost={response.agentcc.cost}")

    def on_error(self, request: CallbackRequest, error: Exception):
        print(f"Failure: {error}")

    def on_retry(self, request, error, attempt, delay):
        print(f"Retry #{attempt} after {delay:.1f}s")

    def on_cache_hit(self, request, response, cache_type):
        print(f"Cache hit ({cache_type})")

    def on_fallback(self, request, original_model, fallback_model, reason):
        print(f"Fallback: {original_model} -> {fallback_model}")

    def on_cost_update(self, request, cost, cumulative_cost):
        print(f"Cost: ${cost:.4f} (total: ${cumulative_cost:.4f})")

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    callbacks=[MyCallback()],
)
```

Built-in callbacks:

```python
from agentcc.callbacks import LoggingCallback, MetricsCallback

metrics = MetricsCallback()

client = AgentCC(
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
    callbacks=[LoggingCallback(level="INFO"), metrics],
)

# After some requests...
print(f"Total requests: {metrics.total_requests}")
print(f"Error rate: {metrics.error_rate:.1%}")
print(f"Avg latency: {metrics.avg_latency:.0f}ms")
print(f"P95 latency: {metrics.p95_latency:.0f}ms")
print(f"P99 latency: {metrics.p99_latency:.0f}ms")
print(f"Total cost: ${metrics.total_cost:.4f}")
```

AgentCC callbacks are more granular than LiteLLM's. Available hooks:

| Hook                    | When it fires                                    |
|-------------------------|--------------------------------------------------|
| `on_request_start`      | Before each request                              |
| `on_request_end`        | After a successful response                      |
| `on_stream_start`       | When streaming begins                            |
| `on_stream_chunk`       | For each streaming chunk                         |
| `on_stream_end`         | When streaming completes                         |
| `on_error`              | On any request failure                           |
| `on_retry`              | Before each retry attempt                        |
| `on_guardrail_warning`  | When guardrail returns 246 (warn)                |
| `on_guardrail_block`    | When guardrail returns 446 (block)               |
| `on_cache_hit`          | When a cache hit is detected                     |
| `on_cost_update`        | After every request with cost tracking           |
| `on_budget_warning`     | When spend exceeds warning threshold             |
| `on_fallback`           | When a fallback model is used                    |
| `on_session_start`      | When a session context manager enters            |
| `on_session_end`        | When a session context manager exits             |

---

## Model Info

### LiteLLM

```python
import litellm

# Get model info
info = litellm.get_model_info("gpt-4o")
print(info["max_tokens"])
print(info["input_cost_per_token"])

# Check capabilities
litellm.supports_vision("gpt-4o")
litellm.supports_function_calling("gpt-4o")
```

### AgentCC

```python
import agentcc

# Get model info
info = agentcc.get_model_info("gpt-4o")
print(info.max_tokens)             # 128000
print(info.max_output_tokens)      # 16384
print(info.input_cost_per_token)   # 2.5e-6
print(info.output_cost_per_token)  # 10e-6

# Check capabilities
agentcc.supports_vision("gpt-4o")              # True
agentcc.supports_function_calling("gpt-4o")    # True
agentcc.supports_json_mode("gpt-4o")           # True
agentcc.supports_response_schema("gpt-4o")     # via supports_json_mode

# List all known models
models = agentcc.get_valid_models()

# Register a custom/fine-tuned model
agentcc.register_model(
    "ft:gpt-4o:my-org:custom:id",
    agentcc.ModelInfo(
        max_tokens=128000,
        max_output_tokens=16384,
        input_cost_per_token=3e-6,
        output_cost_per_token=12e-6,
        supports_function_calling=True,
    ),
)

# Validate environment for a model
agentcc.validate_environment("gpt-4o")
```

AgentCC returns a typed `ModelInfo` dataclass instead of a dictionary. Access fields as attributes, not string keys.

---

## Fallbacks

### LiteLLM

```python
import litellm

response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    fallbacks=["gpt-4o-mini", "claude-sonnet-4-20250514"],
)
```

### AgentCC

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

# Fallbacks happen automatically at the gateway -- no client-side retry loops
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

AgentCC advantage: Fallbacks execute in the Go gateway with microsecond overhead. No Python round-trip per fallback attempt. You can also override parameters per fallback target.

---

## Batch Completions

### LiteLLM

```python
import litellm

responses = litellm.batch_completion(
    model="gpt-4o",
    messages=[
        [{"role": "user", "content": "Hello"}],
        [{"role": "user", "content": "World"}],
    ],
)
```

### AgentCC

```python
import agentcc

responses = agentcc.batch_completion(
    model="gpt-4o",
    messages=[
        [{"role": "user", "content": "Hello"}],
        [{"role": "user", "content": "World"}],
    ],
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
)

# Async variant
responses = await agentcc.abatch_completion(...)

# Across multiple models
responses = agentcc.batch_completion_models(
    models=["gpt-4o", "claude-sonnet-4-20250514"],
    messages=[{"role": "user", "content": "Hello"}],
    api_key="sk-agentcc-...",
    base_url="https://gateway.example.com",
)
```

---

## Quick Reference

| LiteLLM                                  | AgentCC                                                   |
|------------------------------------------|---------------------------------------------------------|
| `litellm.completion(...)`                | `client.chat.completions.create(...)`                   |
| `litellm.acompletion(...)`               | `await client.chat.completions.create(...)`             |
| `litellm.token_counter(...)`             | `agentcc.token_counter(...)`                              |
| `litellm.encode(...)`                    | `agentcc.encode(...)`                                     |
| `litellm.decode(...)`                    | `agentcc.decode(...)`                                     |
| `litellm.completion_cost(...)`           | `agentcc.completion_cost(...)`                            |
| `litellm.get_max_tokens(...)`            | `agentcc.get_max_tokens(...)`                             |
| `litellm.get_model_info(...)`            | `agentcc.get_model_info(...)`                             |
| `litellm.supports_vision(...)`           | `agentcc.supports_vision(...)`                            |
| `litellm.supports_function_calling(...)` | `agentcc.supports_function_calling(...)`                  |
| `litellm.num_retries = 3`               | `AgentCC(max_retries=3)` or `RetryConfig(max_retries=3)` |
| `litellm.callbacks = [...]`             | `AgentCC(callbacks=[...])`                                |
| `litellm.BudgetManager(...)`            | `agentcc.BudgetManager(...)`                              |
| `litellm.batch_completion(...)`          | `agentcc.batch_completion(...)`                           |
| `model="openai/gpt-4o"`                 | `model="gpt-4o"` (gateway handles routing)              |
| `fallbacks=["model-b"]`                 | `FallbackConfig(targets=[FallbackTarget("model-b")])`   |
