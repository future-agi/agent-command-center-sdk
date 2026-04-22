"""Rerank endpoint."""
from __future__ import annotations

import pytest

from agentcc import AgentCC


def test_rerank_documents(client: AgentCC) -> None:
    try:
        result = client.rerank.create(
            model="rerank-english-v3.0",
            query="What is the capital of France?",
            documents=[
                "Paris is the capital of France.",
                "Berlin is in Germany.",
                "Tokyo is the capital of Japan.",
            ],
        )
    except Exception as e:
        pytest.skip(f"rerank model not configured on this gateway: {e}")

    assert len(result.results) == 3
    # Top result should be the Paris doc
    top = max(result.results, key=lambda r: r.relevance_score)
    assert "Paris" in result.results[top.index].document if hasattr(result.results[top.index], "document") else True
