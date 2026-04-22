"""Audio endpoints — transcription + TTS."""
from __future__ import annotations

import io

import pytest

from agentcc import AgentCC

from ._helpers import skip_if_gateway_lacks_endpoint


@pytest.mark.expensive
def test_audio_tts(client: AgentCC) -> None:
    """Generate speech, then verify bytes come back."""
    result = skip_if_gateway_lacks_endpoint(
        lambda: client.audio.speech.create(
            model="gemini-2.5-flash-preview-tts",
            voice="alloy",
            input="Hello.",
        )
    )
    # Response is raw audio bytes
    content = result if isinstance(result, bytes) else result.read()
    assert len(content) > 0


@pytest.mark.expensive
def test_audio_transcription_roundtrip(client: AgentCC) -> None:
    """Create a tiny audio clip via TTS, then transcribe it."""
    tts = skip_if_gateway_lacks_endpoint(
        lambda: client.audio.speech.create(
            model="gemini-2.5-flash-preview-tts",
            voice="alloy",
            input="Testing one two three.",
        )
    )
    audio_bytes = tts if isinstance(tts, bytes) else tts.read()

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "sample.mp3"

    result = skip_if_gateway_lacks_endpoint(
        lambda: client.audio.transcriptions.create(
            model="gemini-2.0-flash",
            file=audio_file,
        )
    )
    assert result.text
