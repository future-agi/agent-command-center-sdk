"""Batch operations for parallel completions.

Demonstrates three batch strategies:
1. batch_completion — same model, multiple prompts in parallel
2. batch_completion_models — race multiple models, first response wins
3. batch_completion_models_all — query all models, collect all results
"""

import os

from agentcc import AgentCC, batch_completion, batch_completion_models, batch_completion_models_all

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")

client = AgentCC(api_key=API_KEY, base_url=BASE_URL)

# ---- 1. batch_completion: Multiple prompts, one model ----
print("=== batch_completion ===")
prompts = [
    [{"role": "user", "content": "Capital of France?"}],
    [{"role": "user", "content": "Capital of Japan?"}],
    [{"role": "user", "content": "Capital of Brazil?"}],
]

# Sends all 3 prompts in parallel (up to max_concurrency threads)
results = batch_completion(
    client,
    model="gpt-4o-mini",
    messages_list=prompts,
    max_concurrency=3,
    max_tokens=50,
)

for i, result in enumerate(results):
    if isinstance(result, Exception):
        print(f"  Prompt {i}: ERROR - {result}")
    else:
        print(f"  Prompt {i}: {result.choices[0].message.content}")

# ---- 2. batch_completion_models: Race models, first wins ----
print("\n=== batch_completion_models (race) ===")
fastest = batch_completion_models(
    client,
    models=["gpt-4o-mini", "gpt-4o"],
    messages=[{"role": "user", "content": "Say hello in one word."}],
    max_tokens=10,
)
print(f"  Fastest model: {fastest.model}")
print(f"  Response: {fastest.choices[0].message.content}")

# ---- 3. batch_completion_models_all: Query all, compare results ----
print("\n=== batch_completion_models_all (compare) ===")
all_results = batch_completion_models_all(
    client,
    models=["gpt-4o-mini", "gpt-4o"],
    messages=[{"role": "user", "content": "What is 2+2?"}],
    return_exceptions=True,  # Don't fail if one model errors
    max_tokens=50,
)

for i, result in enumerate(all_results):
    if isinstance(result, Exception):
        print(f"  Model {i}: ERROR - {result}")
    else:
        print(f"  {result.model}: {result.choices[0].message.content}")

client.close()
