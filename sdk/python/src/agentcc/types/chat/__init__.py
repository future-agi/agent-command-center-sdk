"""Chat completion type definitions."""

from __future__ import annotations

from agentcc.types.chat.chat_completion import ChatCompletion, Choice
from agentcc.types.chat.chat_completion_chunk import (
    ChatCompletionChunk,
    Delta,
    FunctionCallDelta,
    StreamChoice,
    ToolCallDelta,
)
from agentcc.types.chat.chat_completion_message import (
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessage,
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCallParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionToolMessageParam,
    ChatCompletionUserMessageParam,
    FunctionCall,
    FunctionCallParam,
    ToolCall,
)
from agentcc.types.chat.completion_create_params import CompletionCreateParams, StreamOptions

__all__ = [
    "ChatCompletion",
    "ChatCompletionAssistantMessageParam",
    "ChatCompletionChunk",
    "ChatCompletionMessage",
    "ChatCompletionMessageParam",
    "ChatCompletionMessageToolCallParam",
    "ChatCompletionSystemMessageParam",
    "ChatCompletionToolMessageParam",
    "ChatCompletionUserMessageParam",
    "Choice",
    "CompletionCreateParams",
    "Delta",
    "FunctionCall",
    "FunctionCallDelta",
    "FunctionCallParam",
    "StreamChoice",
    "StreamOptions",
    "ToolCall",
    "ToolCallDelta",
]
