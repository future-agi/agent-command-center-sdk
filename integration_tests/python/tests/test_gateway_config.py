from __future__ import annotations

from agentcc import AgentCC
from agentcc.config import (
    CacheConfig,
    GatewayConfig,
    RetryConfig,
)


def test_gateway_config_combined_headers() -> None:
    config = GatewayConfig(
        cache=CacheConfig(ttl="60s", namespace="agentcc-itest", force_refresh=False),
        retry=RetryConfig(max_retries=2),
    )
    headers = config.to_headers()
    assert headers["x-agentcc-cache-ttl"] == "60s"
    assert headers["x-agentcc-cache-namespace"] == "agentcc-itest"
    assert "x-agentcc-config" in headers


def test_gateway_config_sent_end_to_end(client: AgentCC) -> None:
    config = GatewayConfig(
        cache=CacheConfig(ttl="60s", namespace="agentcc-itest-combined"),
        retry=RetryConfig(max_retries=1),
    )
    result = client.chat.completions.create(
        model="gemini-2.0-flash",
        messages=[{"role": "user", "content": "ok"}],
        extra_headers=config.to_headers(),
        max_tokens=3,
    )
    assert result.agentcc is not None


def test_create_headers_helper() -> None:
    from agentcc import create_headers
    from agentcc._gateway_config import (
        CacheConfig as DCCacheConfig,
    )
    from agentcc._gateway_config import (
        GatewayConfig as DCGatewayConfig,
    )

    headers = create_headers(
        api_key="sk-test",
        config=DCGatewayConfig(cache=DCCacheConfig(ttl=300)),
        trace_id="trace-xyz",
        user_id="user-42",
        metadata={"tier": "gold"},
    )
    assert headers["Authorization"] == "Bearer sk-test"
    assert headers["x-agentcc-trace-id"] == "trace-xyz"
    assert headers["x-agentcc-user-id"] == "user-42"
    assert "x-agentcc-metadata" in headers
    assert headers["x-agentcc-cache-ttl"] == "300"
