"""Files + Batches endpoints."""
from __future__ import annotations

import io

import pytest

from agentcc import AgentCC

from ._helpers import skip_if_gateway_lacks_endpoint


@pytest.mark.mutating
def test_file_upload_list_delete(client: AgentCC, itest_name: str) -> None:
    """Round-trip: upload → verify in list → delete."""
    content = f"integration test file for {itest_name}".encode()
    buf = io.BytesIO(content)
    buf.name = f"{itest_name}.txt"

    uploaded = skip_if_gateway_lacks_endpoint(
        lambda: client.files.create(file=buf, purpose="batch")
    )
    try:
        assert uploaded.id
        assert uploaded.bytes == len(content)

        listing = client.files.list()
        assert any(f.id == uploaded.id for f in listing.data)
    finally:
        try:
            client.files.delete(uploaded.id)
        except Exception:
            pass


@pytest.mark.mutating
@pytest.mark.expensive
def test_batch_create_and_cancel(client: AgentCC, itest_name: str) -> None:
    """Start a batch (requests-list signature), cancel immediately."""
    requests = [
        {
            "custom_id": f"{itest_name}-1",
            "method": "POST",
            "url": "/v1/chat/completions",
            "body": {
                "model": "gemini-2.0-flash",
                "messages": [{"role": "user", "content": "ok"}],
                "max_tokens": 3,
            },
        }
    ]
    batch = skip_if_gateway_lacks_endpoint(lambda: client.batches.create(requests))
    batch_id = batch.id
    try:
        assert batch_id
        fetched = client.batches.retrieve(batch_id)
        assert fetched.id == batch_id
    finally:
        try:
            client.batches.cancel(batch_id)
        except Exception:
            pass
