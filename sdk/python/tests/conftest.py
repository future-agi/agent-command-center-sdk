"""Shared pytest fixtures for AgentCC SDK tests."""


def pytest_addoption(parser):
    # Public registration works with pytest-asyncio 0.23 (which has no such
    # option) and newer versions. Explicit ini/CLI values still take priority.
    parser.addini(
        "asyncio_default_fixture_loop_scope",
        "Default event-loop scope for asynchronous test fixtures",
        type="string",
        default="function",
    )
