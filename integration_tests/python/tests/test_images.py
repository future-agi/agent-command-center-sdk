"""Images endpoint — generation."""
from __future__ import annotations

from agentcc import AgentCC

from ._helpers import skip_if_gateway_lacks_endpoint


def test_image_generation(client: AgentCC) -> None:
    result = skip_if_gateway_lacks_endpoint(
        lambda: client.images.generate(
            model="imagen-4.0-generate-001",
            prompt="A small red circle on a white background.",
            n=1,
        )
    )
    assert len(result.data) == 1
    assert result.data[0].url or result.data[0].b64_json
