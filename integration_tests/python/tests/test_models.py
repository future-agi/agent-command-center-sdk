from __future__ import annotations

import pytest
from agentcc import AgentCC, AsyncAgentCC
from agentcc._exceptions import (
    APIStatusError,
    BadGatewayError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
)

from ._helpers import skip_if_gateway_lacks_endpoint


def test_models_list(client: AgentCC) -> None:
    result = skip_if_gateway_lacks_endpoint(lambda: client.models.list())
    assert result is not None
    assert hasattr(result, "data")


def test_models_retrieve(client: AgentCC) -> None:
    result = skip_if_gateway_lacks_endpoint(
        lambda: client.models.retrieve("gemini-2.0-flash")
    )
    assert result is not None


async def test_async_models_list(async_client: AsyncAgentCC) -> None:
    try:
        result = await async_client.models.list()
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    await async_client.aclose()
    assert result is not None


async def test_async_models_retrieve(async_client: AsyncAgentCC) -> None:
    try:
        result = await async_client.models.retrieve("gemini-2.0-flash")
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    await async_client.aclose()
    assert result is not None
