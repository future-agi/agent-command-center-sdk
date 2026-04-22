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

MODEL = "gpt-4o-mini"


def test_responses_create(client: AgentCC) -> None:
    result = skip_if_gateway_lacks_endpoint(
        lambda: client.responses.create(
            model=MODEL,
            input="Say 'hi'.",
            max_output_tokens=32,
            store=False,
        )
    )
    assert result is not None


def test_responses_retrieve_skips_on_stateless_gateway(client: AgentCC) -> None:
    created = skip_if_gateway_lacks_endpoint(
        lambda: client.responses.create(
            model=MODEL,
            input="ok",
            max_output_tokens=16,
            store=True,
        )
    )
    rid = getattr(created, "id", None)
    if not rid:
        pytest.skip("gateway didn't return a response id")
    skip_if_gateway_lacks_endpoint(lambda: client.responses.retrieve(rid))


def test_responses_delete_skips_gracefully(client: AgentCC) -> None:
    created = skip_if_gateway_lacks_endpoint(
        lambda: client.responses.create(
            model=MODEL,
            input="ok",
            max_output_tokens=16,
            store=True,
        )
    )
    rid = getattr(created, "id", None)
    if not rid:
        pytest.skip("gateway didn't return a response id")
    skip_if_gateway_lacks_endpoint(lambda: client.responses.delete(rid))


async def test_async_responses_create(async_client: AsyncAgentCC) -> None:
    try:
        await async_client.responses.create(
            model=MODEL,
            input="hi",
            max_output_tokens=16,
            store=False,
        )
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    await async_client.aclose()
