"""Testing utilities for AgentCC SDK applications.

Demonstrates MockAgentCC for unit tests, assertion helpers for validating
responses, and mock_completion/mock_error factories for test fixtures.
No real API calls are made.
"""

from agentcc.testing import (
    MockAgentCC,
    assert_completion_has_content,
    assert_completion_valid,
    make_completion,
    make_tool_call,
    mock_completion,
    mock_error,
)


def test_basic_mock():
    """MockAgentCC returns pre-configured responses without hitting the network."""
    client = MockAgentCC()

    # Register responses (returned in order)
    client.chat.completions.respond_with(mock_completion("Paris"))
    client.chat.completions.respond_with(mock_completion("Tokyo"))

    # Call .create() like normal -- returns mocked responses
    r1 = client.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": "Capital of France?"}])
    r2 = client.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": "Capital of Japan?"}])

    assert r1.choices[0].message.content == "Paris"
    assert r2.choices[0].message.content == "Tokyo"

    # Inspect what was called
    assert len(client.chat.completions.calls) == 2
    assert client.chat.completions.calls[0]["model"] == "gpt-4o"
    print("test_basic_mock PASSED")


def test_assertion_helpers():
    """Assertion helpers validate response structure."""
    response = mock_completion("Hello, world!", model="gpt-4o")

    # Validate structure
    assert_completion_valid(response)

    # Check content
    assert_completion_has_content(response, "Hello")

    print("test_assertion_helpers PASSED")


def test_mock_with_tool_calls():
    """Create mock responses with tool calls."""
    tc = make_tool_call(id="call_1", name="get_weather", arguments='{"location":"NYC"}')
    response = make_completion(content="", tool_calls=[tc])

    assert response.choices[0].message.tool_calls is not None
    assert response.choices[0].message.tool_calls[0].function.name == "get_weather"
    print("test_mock_with_tool_calls PASSED")


def test_mock_errors():
    """Simulate API errors in tests."""
    client = MockAgentCC()
    client.chat.completions.respond_with(mock_error(429, "Rate limit exceeded"))

    try:
        client.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": "test"}])
        assert False, "Should have raised"
    except Exception as e:
        assert "Rate limit" in str(e)
        print(f"test_mock_errors PASSED (caught: {type(e).__name__})")


def test_default_response():
    """MockAgentCC returns a sensible default if no responses are registered."""
    client = MockAgentCC()
    response = client.chat.completions.create(model="gpt-4o", messages=[])
    assert_completion_valid(response)
    print("test_default_response PASSED")


if __name__ == "__main__":
    test_basic_mock()
    test_assertion_helpers()
    test_mock_with_tool_calls()
    test_mock_errors()
    test_default_response()
    print("\nAll tests passed!")
