from __future__ import annotations

import io

import pytest
from agentcc import AgentCC

from ._helpers import skip_if_gateway_lacks_endpoint


@pytest.mark.mutating
def test_files_retrieve_and_content(client: AgentCC, itest_name: str) -> None:
    content = f"retrieve-content test {itest_name}".encode()
    buf = io.BytesIO(content)
    buf.name = f"{itest_name}.txt"

    uploaded = skip_if_gateway_lacks_endpoint(
        lambda: client.files.create(file=buf, purpose="batch")
    )
    try:
        fetched = skip_if_gateway_lacks_endpoint(
            lambda: client.files.retrieve(uploaded.id)
        )
        assert fetched.id == uploaded.id

        body = skip_if_gateway_lacks_endpoint(
            lambda: client.files.content(uploaded.id)
        )
        assert isinstance(body, bytes)
        assert len(body) > 0
    finally:
        try:
            client.files.delete(uploaded.id)
        except Exception:
            pass
