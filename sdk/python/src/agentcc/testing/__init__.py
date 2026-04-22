"""AgentCC testing utilities."""

from __future__ import annotations

from agentcc.testing.assertions import (
    assert_completion_has_content,
    assert_completion_valid,
    assert_cost_tracked,
    assert_guardrail_blocked,
    assert_agentcc_metadata,
    assert_stream_valid,
    assert_usage_valid,
)
from agentcc.testing.fixtures import make_completion, make_message, make_agentcc_metadata, make_tool_call, make_usage
from agentcc.testing.mock import MockAgentCC, create_mock_client, mock_completion, mock_error
from agentcc.testing.recorder import Interaction, RecordingAgentCC, RequestRecorder

__all__ = [
    "Interaction",
    "MockAgentCC",
    "RecordingAgentCC",
    "RequestRecorder",
    "assert_completion_has_content",
    "assert_completion_valid",
    "assert_cost_tracked",
    "assert_guardrail_blocked",
    "assert_agentcc_metadata",
    "assert_stream_valid",
    "assert_usage_valid",
    "create_mock_client",
    "make_completion",
    "make_message",
    "make_agentcc_metadata",
    "make_tool_call",
    "make_usage",
    "mock_completion",
    "mock_error",
]
