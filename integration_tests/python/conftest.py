"""Shared fixtures for integration tests.

Skips gracefully if the environment isn't configured so a bare `pytest`
invocation on a dev machine doesn't error — it just reports "no tests collected".
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from agentcc import AgentCC, AsyncAgentCC  # noqa: E402


API_KEY = os.getenv("AGENTCC_API_KEY")
BASE_URL = os.getenv("AGENTCC_BASE_URL")
MUTATING = os.getenv("MUTATING") == "1"


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    skip_no_key = pytest.mark.skip(reason="AGENTCC_API_KEY / AGENTCC_BASE_URL not set")
    skip_mutating = pytest.mark.skip(reason="set MUTATING=1 to enable")

    for item in items:
        if not (API_KEY and BASE_URL):
            item.add_marker(skip_no_key)
        if "mutating" in item.keywords and not MUTATING:
            item.add_marker(skip_mutating)


@pytest.fixture(scope="session")
def client() -> AgentCC:
    assert API_KEY and BASE_URL
    return AgentCC(api_key=API_KEY, base_url=BASE_URL)


@pytest.fixture
def async_client() -> AsyncAgentCC:
    assert API_KEY and BASE_URL
    return AsyncAgentCC(api_key=API_KEY, base_url=BASE_URL)


@pytest.fixture
def itest_name() -> str:
    return f"agentcc-itest-{uuid.uuid4().hex[:8]}"
