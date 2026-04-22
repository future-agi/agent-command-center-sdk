"""Resource classes — chat, completions, embeddings, moderations, rerank,
images, audio, files, batches, responses, feedback, models."""

from __future__ import annotations

from agentcc.resources.audio import (
    AsyncAudio,
    AsyncSpeech,
    AsyncTranscriptions,
    AsyncTranslations,
    Audio,
    Speech,
    Transcriptions,
    Translations,
)
from agentcc.resources.batches import AsyncBatches, Batches
from agentcc.resources.chat import AsyncChat, Chat
from agentcc.resources.completions import AsyncCompletions, Completions
from agentcc.resources.embeddings import AsyncEmbeddings, Embeddings
from agentcc.resources.files import AsyncFiles, Files
from agentcc.resources.images import AsyncImages, Images
from agentcc.resources.models import AsyncModels, Models
from agentcc.resources.moderations import AsyncModerations, Moderations
from agentcc.resources.rerank import AsyncRerank, Rerank
from agentcc.resources.responses import AsyncResponses, Responses

__all__ = [
    "AsyncAudio",
    "AsyncBatches",
    "AsyncChat",
    "AsyncCompletions",
    "AsyncEmbeddings",
    "AsyncFiles",
    "AsyncImages",
    "AsyncModels",
    "AsyncModerations",
    "AsyncRerank",
    "AsyncResponses",
    "AsyncSpeech",
    "AsyncTranscriptions",
    "AsyncTranslations",
    "Audio",
    "Batches",
    "Chat",
    "Completions",
    "Embeddings",
    "Files",
    "Images",
    "Models",
    "Moderations",
    "Rerank",
    "Responses",
    "Speech",
    "Transcriptions",
    "Translations",
]
