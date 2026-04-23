# Integration Tests

End-to-end tests for the `agentcc` Python and TypeScript SDKs, run against a
real running Agent Command Center gateway.

These tests exist to verify the HTTP contract between the SDKs and the gateway.
Unit tests can only assert that the SDK builds the right request; only these
integration tests prove the gateway actually accepts it and returns the shape
the SDK expects.

## Layout

```
integration_tests/
├── python/        # pytest suite — uses sdk/python in editable mode
└── typescript/    # vitest suite — uses sdk/typescript via workspace link
```

Each suite is self-contained (separate env file, own config, own deps).

## Setup

1. Spin up or point at a running gateway (production, staging, or local).
2. Copy `.env.example` → `.env` in the language dir you want to run, fill in:
   - `AGENTCC_API_KEY` — gateway key
   - `AGENTCC_BASE_URL` — e.g. `https://gateway.futureagi.com`
3. Mutating tests (file upload / batch create) only run when `MUTATING=1`.

## Running

Python:
```bash
cd integration_tests/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ../../sdk/python[testing,validation,tiktoken]
pip install -r requirements.txt
pytest                             # all non-mutating
MUTATING=1 pytest                  # include create/delete ops
pytest tests/test_wire_format.py   # only the HTTP contract checks
```

TypeScript:
```bash
cd integration_tests/typescript
npm install
npm test                           # all non-mutating
MUTATING=1 npm test                # include create/delete ops
npm test -- tests/wire-format.test.ts
```

## Safety

- All mutating tests auto-cleanup their resources (API keys, webhooks, alerts,
  uploaded files, batches) in a `finally` block. If a test crashes mid-run,
  leftover resources may remain — search the Agent Command Center dashboard
  for names matching `agentcc-itest-*` and delete manually.
- LLM calls use cheap models (`gpt-4o-mini`, `text-embedding-3-small`,
  `whisper-1`) with minimal prompts. A full non-mutating run costs < $0.10.
- These tests hit real LLM providers via your gateway. Real tokens, real
  logs, real billing.
