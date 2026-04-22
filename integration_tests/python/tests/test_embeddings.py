"""Embeddings endpoint."""
from __future__ import annotations

from agentcc import AgentCC

from ._helpers import skip_if_gateway_lacks_endpoint

MODEL = "gemini-embedding-001"


def test_single_embedding(client: AgentCC) -> None:
    result = skip_if_gateway_lacks_endpoint(
        lambda: client.embeddings.create(model=MODEL, input="hello world")
    )
    assert len(result.data) == 1
    assert len(result.data[0].embedding) > 0


def test_batch_embeddings(client: AgentCC) -> None:
    result = skip_if_gateway_lacks_endpoint(
        lambda: client.embeddings.create(model=MODEL, input=["foo", "bar", "baz"])
    )
    assert len(result.data) == 3
    assert all(len(d.embedding) > 0 for d in result.data)
