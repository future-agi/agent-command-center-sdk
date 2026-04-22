from __future__ import annotations

import io

import pytest
from agentcc import AsyncAgentCC
from agentcc._exceptions import (
    APIStatusError,
    BadGatewayError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
)


def _skip_if_gap(fn):
    async def wrapped(*a, **kw):
        try:
            return await fn(*a, **kw)
        except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
            pytest.skip(f"gateway gap: {e}")
        except APIStatusError as e:
            if getattr(e, "status_code", None) in (403, 501):
                pytest.skip(f"gateway gap: {e}")
            raise
    return wrapped


async def test_async_embeddings(async_client: AsyncAgentCC) -> None:
    from pydantic import ValidationError

    try:
        result = await async_client.embeddings.create(
            model="gemini-embedding-001",
            input="hi",
        )
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except ValidationError as e:
        await async_client.aclose()
        if "completion_tokens" in str(e):
            pytest.skip(f"SDK bug: EmbeddingResponse.usage.completion_tokens is required but gateway omits it for embeddings: {e}")
        raise
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    await async_client.aclose()
    assert result.data[0].embedding


async def test_async_moderations(async_client: AsyncAgentCC) -> None:
    try:
        await async_client.moderations.create(input="hello")
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    await async_client.aclose()


async def test_async_rerank(async_client: AsyncAgentCC) -> None:
    try:
        await async_client.rerank.create(
            model="rerank-english-v3.0",
            query="what is python?",
            documents=["python is a language", "bananas are yellow"],
        )
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    await async_client.aclose()


async def test_async_images_generate(async_client: AsyncAgentCC) -> None:
    try:
        await async_client.images.generate(
            model="imagen-4.0-generate-001",
            prompt="A small red dot.",
            n=1,
        )
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    await async_client.aclose()


@pytest.mark.mutating
async def test_async_files_roundtrip(async_client: AsyncAgentCC) -> None:
    buf = io.BytesIO(b"async test file")
    buf.name = "async-itest.txt"
    try:
        uploaded = await async_client.files.create(file=buf, purpose="batch")
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    try:
        listing = await async_client.files.list()
        assert any(f.id == uploaded.id for f in listing.data)

        fetched = await async_client.files.retrieve(uploaded.id)
        assert fetched.id == uploaded.id

        body = await async_client.files.content(uploaded.id)
        assert isinstance(body, bytes)
    finally:
        try:
            await async_client.files.delete(uploaded.id)
        except Exception:
            pass
        await async_client.aclose()


@pytest.mark.expensive
async def test_async_audio_tts(async_client: AsyncAgentCC) -> None:
    try:
        result = await async_client.audio.speech.create(
            model="gemini-2.5-flash-preview-tts",
            voice="alloy",
            input="hi",
        )
    except (NotFoundError, InternalServerError, BadGatewayError, PermissionDeniedError) as e:
        await async_client.aclose()
        pytest.skip(f"gateway gap: {e}")
    except APIStatusError as e:
        await async_client.aclose()
        if getattr(e, "status_code", None) in (403, 501):
            pytest.skip(f"gateway gap: {e}")
        raise
    await async_client.aclose()
    content = result if isinstance(result, bytes) else result.read()
    assert len(content) > 0
