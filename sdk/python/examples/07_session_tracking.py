"""Session tracking across multi-step workflows.

Demonstrates using client.session() to group related API calls under a
single session.  The gateway receives x-agentcc-session-* headers for
correlation, analytics, and hierarchical path tracking.
"""

import os

from agentcc import AgentCC

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")

client = AgentCC(api_key=API_KEY, base_url=BASE_URL)

# session() returns a context manager that auto-attaches session headers
with client.session(name="research-assistant", metadata={"project": "demo"}) as sess:
    print(f"Session ID: {sess.session_id}")
    print(f"Initial path: {sess.path}")

    # Step 1: Search phase
    sess.step("search")
    print(f"After step('search'): {sess.path}")  # /search

    response1 = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "List 3 facts about quantum computing."}],
        max_tokens=200,
    )
    # Track cost and tokens for the session
    sess.track_request(cost=0.001, tokens=response1.usage.total_tokens if response1.usage else 0)
    print(f"  Search result: {response1.choices[0].message.content[:80]}...")

    # Step 2: Summarize phase (path becomes /search/summarize)
    sess.step("summarize")
    print(f"After step('summarize'): {sess.path}")

    response2 = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": "Summarize this in one sentence."},
            {"role": "assistant", "content": response1.choices[0].message.content},
            {"role": "user", "content": "Now make it even shorter."},
        ],
        max_tokens=100,
    )
    sess.track_request(cost=0.0005, tokens=response2.usage.total_tokens if response2.usage else 0)
    print(f"  Summary: {response2.choices[0].message.content[:80]}...")

    # Session stats
    print(f"\nSession summary:")
    print(f"  Requests: {sess.request_count}")
    print(f"  Total cost: ${sess.total_cost:.4f}")
    print(f"  Total tokens: {sess.total_tokens}")
    print(f"  Steps: {sess._steps}")

    # Reset path for a new workflow branch
    sess.reset_path()
    print(f"After reset_path(): {sess.path}")  # /

# Session headers are no longer attached after exiting the context
print("\nSession context exited. Subsequent requests have no session headers.")

client.close()
