"""AgentCC type definitions."""

from __future__ import annotations

from agentcc.types.agentcc_metadata import AgentCCMetadata, RateLimitInfo
from agentcc.types.audio import Transcription, Translation
from agentcc.types.batch import BatchResponse
from agentcc.types.completion import Completion, CompletionChoice
from agentcc.types.embedding import Embedding, EmbeddingResponse
from agentcc.types.files import FileDeleted, FileList, FileObject
from agentcc.types.gateway_config import HealthResponse
from agentcc.types.image import Image, ImageResponse
from agentcc.types.model import Model, ModelList
from agentcc.types.moderation import ModerationResponse, ModerationResult
from agentcc.types.rerank import RerankResponse, RerankResult
from agentcc.types.responses import (
    ContentPart,
    ResponseObject,
    ResponseOutput,
    ResponseStreamEvent,
    ResponseUsage,
)
from agentcc.types.shared import ErrorBody, ErrorResponse, Usage

__all__ = [
    "AgentCCMetadata",
    "BatchResponse",
    "Completion",
    "CompletionChoice",
    "ContentPart",
    "Embedding",
    "EmbeddingResponse",
    "ErrorBody",
    "ErrorResponse",
    "FileDeleted",
    "FileList",
    "FileObject",
    "HealthResponse",
    "Image",
    "ImageResponse",
    "Model",
    "ModelList",
    "ModerationResponse",
    "ModerationResult",
    "RateLimitInfo",
    "RerankResponse",
    "RerankResult",
    "ResponseObject",
    "ResponseOutput",
    "ResponseStreamEvent",
    "ResponseUsage",
    "Transcription",
    "Translation",
    "Usage",
]
