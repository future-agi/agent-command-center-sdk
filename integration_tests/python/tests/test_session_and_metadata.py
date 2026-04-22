"""Session context manager + metadata propagation.

Headers the gateway sees when a session is active:
  x-agentcc-session-id, x-agentcc-session-name, x-agentcc-session-path, x-agentcc-metadata-*
"""
from __future__ import annotations

from agentcc import AgentCC
from agentcc._session import Session


def test_session_to_headers_produces_agentcc_wire() -> None:
    """Unit-ish: confirm Session.to_headers() uses x-agentcc-* names."""
    s = Session(session_id="s-abc", name="my-flow", metadata={"proj": "demo"})
    s.step("search")
    s.step("summarize")

    headers = s.to_headers()
    assert headers["x-agentcc-session-id"] == "s-abc"
    assert headers["x-agentcc-session-name"] == "my-flow"
    assert headers["x-agentcc-session-path"] == "/search/summarize"
    assert headers["x-agentcc-metadata-proj"] == "demo"


def test_session_context_attaches_headers(client: AgentCC, itest_name: str) -> None:
    """Session auto-attaches to outbound requests via client._active_session."""
    with client.session(name=itest_name, metadata={"itest": "session"}) as sess:
        sess.step("wire-check")
        result = client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=[{"role": "user", "content": "ok"}],
            max_tokens=3,
        )
        assert result.agentcc is not None
        assert result.agentcc.request_id
        assert sess.path == "/wire-check"


def test_session_tracks_cost_and_tokens(client: AgentCC) -> None:
    with client.session(name="tracking-check") as sess:
        result = client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=5,
        )
        tokens = result.usage.total_tokens if result.usage else 0
        sess.track_request(cost=0.0, tokens=tokens)
        assert sess.request_count == 1
        assert sess.total_tokens == tokens


def test_client_level_metadata(client: AgentCC, itest_name: str) -> None:
    """client.with_options(metadata=...) should be sent on every request."""
    scoped = client.with_options(metadata={"itest": itest_name, "purpose": "wire-verify"})
    result = scoped.chat.completions.create(
        model="gemini-2.0-flash",
        messages=[{"role": "user", "content": "ok"}],
        max_tokens=3,
    )
    assert result.agentcc is not None
