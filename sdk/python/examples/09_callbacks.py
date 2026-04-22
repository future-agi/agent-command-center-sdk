"""Custom callbacks for request/response lifecycle hooks.

Demonstrates creating a CallbackHandler subclass that gets notified
before and after every API call.  Useful for logging, metrics,
alerting, and custom observability.
"""

import os
import time

from agentcc import AgentCC
from agentcc.callbacks.base import CallbackHandler, CallbackRequest, CallbackResponse

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")


class MetricsCallback(CallbackHandler):
    """Example callback that tracks timing and logs every request."""

    def __init__(self) -> None:
        self.request_count = 0
        self.total_cost = 0.0
        self._start_times: dict[str, float] = {}

    def on_request_start(self, request: CallbackRequest) -> None:
        """Called before each request is sent."""
        self.request_count += 1
        self._start_times[request.url] = time.time()
        model = request.body.get("model", "unknown") if request.body else "unknown"
        print(f"[START] #{self.request_count} {request.method} {request.url} model={model}")

    def on_request_end(self, request: CallbackRequest, response: CallbackResponse) -> None:
        """Called after a successful response."""
        elapsed = time.time() - self._start_times.pop(request.url, time.time())
        print(f"[END]   status={response.status_code} latency={elapsed:.3f}s")
        if response.agentcc and response.agentcc.cost:
            self.total_cost += response.agentcc.cost
            print(f"        cost=${response.agentcc.cost:.6f} cumulative=${self.total_cost:.6f}")

    def on_error(self, request: CallbackRequest, error: Exception) -> None:
        """Called when a request fails."""
        print(f"[ERROR] {request.url}: {error}")

    def on_retry(self, request: CallbackRequest, error: Exception, attempt: int, delay: float) -> None:
        """Called before a retry attempt."""
        print(f"[RETRY] attempt={attempt} delay={delay:.1f}s reason={error}")

    def on_cache_hit(self, request: CallbackRequest, response: CallbackResponse, cache_type: str) -> None:
        """Called when a cached response is returned."""
        print(f"[CACHE] {cache_type} hit for {request.url}")

    def on_guardrail_block(self, request: CallbackRequest, error: object) -> None:
        """Called when a guardrail blocks the request."""
        print(f"[GUARD] Request blocked: {error}")

    def on_fallback(self, request: CallbackRequest, original_model: str, fallback_model: str, reason: str) -> None:
        """Called when the gateway falls back to another model."""
        print(f"[FALLBACK] {original_model} -> {fallback_model}: {reason}")


# Pass callbacks to the client -- they fire on every request
metrics = MetricsCallback()
client = AgentCC(api_key=API_KEY, base_url=BASE_URL, callbacks=[metrics])

# Make a few requests
for prompt in ["Hello!", "What is 2+2?", "Tell me a joke."]:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=50,
    )

print(f"\nTotal requests: {metrics.request_count}")
print(f"Total cost: ${metrics.total_cost:.6f}")

client.close()
