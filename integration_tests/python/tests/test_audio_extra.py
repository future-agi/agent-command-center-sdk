from __future__ import annotations

import io

import pytest
from agentcc import AgentCC

from ._helpers import skip_if_gateway_lacks_endpoint


@pytest.mark.expensive
def test_audio_translations_roundtrip(client: AgentCC) -> None:
    tts = skip_if_gateway_lacks_endpoint(
        lambda: client.audio.speech.create(
            model="gemini-2.5-flash-preview-tts",
            voice="alloy",
            input="Bonjour le monde.",
        )
    )
    audio_bytes = tts if isinstance(tts, bytes) else tts.read()

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "sample.mp3"

    result = skip_if_gateway_lacks_endpoint(
        lambda: client.audio.translations.create(
            model="gemini-2.0-flash",
            file=audio_file,
        )
    )
    assert result.text is not None
