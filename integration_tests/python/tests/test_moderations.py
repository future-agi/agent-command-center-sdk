"""Moderations endpoint."""
from __future__ import annotations

from agentcc import AgentCC

from ._helpers import skip_if_gateway_lacks_endpoint


def test_moderation_safe_input(client: AgentCC) -> None:
    result = skip_if_gateway_lacks_endpoint(
        lambda: client.moderations.create(
            model="omni-moderation-latest",
            input="I love puppies.",
        )
    )
    assert len(result.results) == 1


def test_moderation_well_formed_response(client: AgentCC) -> None:
    result = skip_if_gateway_lacks_endpoint(
        lambda: client.moderations.create(
            model="omni-moderation-latest",
            input="Some neutral text about weather.",
        )
    )
    assert len(result.results) == 1
    assert result.results[0].categories is not None
