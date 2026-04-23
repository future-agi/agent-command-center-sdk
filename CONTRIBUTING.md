# Contributing to `agent-command-center`

Thanks for your interest in contributing! This repo ships the client SDKs for [Agent Command Center](https://github.com/future-agi/future-agi) — the Python and TypeScript libraries plus the LangChain, LlamaIndex, React, and Vercel AI SDK integrations.

We welcome contributions of all kinds: bug fixes, new framework integrations, examples, docs improvements, type-tightening, performance work, and issue triage.

---

## Quick links

- 🐛 [Report a bug](https://github.com/future-agi/agent-command-center/issues/new?template=bug_report.yml)
- ✨ [Request a feature](https://github.com/future-agi/agent-command-center/issues/new?template=feature_request.yml)
- 🔖 [Good first issues](https://github.com/future-agi/agent-command-center/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- 💬 [Join Discord](https://discord.gg/UjZ2gRT5p)
- 📖 [Shared vocabulary & style guide](docs/VOCABULARY.md)
- 📖 [Full docs](https://docs.futureagi.com)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold it. Report unacceptable behavior to **conduct@futureagi.com**.

---

## Contributor License Agreement (CLA)

Before we can merge your first pull request, you'll need to sign our Contributor License Agreement. This is a one-click process that runs automatically on your first PR — you'll see a link to sign, we merge after.

The CLA grants Future AGI, Inc. the rights to use your contribution (including an Apache-style patent grant), while letting you retain copyright.

---

## Repository layout

```
agent-command-center/
├── README.md                          # monorepo landing
├── docs/VOCABULARY.md                 # shared naming + voice guide
├── sdk/
│   ├── python/                        # agentcc (PyPI)
│   └── typescript/                    # @agentcc/client (npm)
│       └── packages/
│           ├── agentcc-langchain/     # @agentcc/langchain
│           ├── agentcc-llamaindex/    # @agentcc/llamaindex
│           ├── agentcc-react/         # @agentcc/react
│           └── agentcc-vercel/        # @agentcc/vercel
└── integration_tests/                 # end-to-end tests against a real gateway
    ├── python/                        # pytest
    └── typescript/                    # vitest
```

---

## Development setup

### 1. Fork and clone

```bash
gh repo fork future-agi/agent-command-center --clone
cd agent-command-center
```

### 2. Python SDK

We use [venv](https://docs.python.org/3/library/venv.html) — macOS blocks raw `pip install` outside a venv (PEP 668).

```bash
cd sdk/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Run unit tests
pytest

# Type-check + lint
mypy src/agentcc
ruff check src/agentcc
```

### 3. TypeScript SDK + sub-packages

```bash
cd sdk/typescript
npm install
npm run build           # builds ESM + CJS
npm test                # vitest
npm run typecheck
npm run lint
```

Each sub-package (`packages/agentcc-*`) has its own `build` / `test` / `typecheck` scripts. From the sub-package dir:

```bash
cd packages/agentcc-langchain
npm run build
npm test
```

### 4. Integration tests (against a real gateway)

See [`integration_tests/README.md`](integration_tests/README.md). You'll need an `AGENTCC_API_KEY` and a reachable gateway. A full non-mutating Python run costs under $0.10 — cheap, but not free.

---

## Making a change

1. Create a branch off `main`. Branch name convention: `<type>/<short-description>` where type is `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, or `perf`.
   ```bash
   git checkout -b fix/langchain-streaming-race
   ```
2. Make your change. Keep it focused — one PR, one concern.
3. Add or update tests. Unit tests for logic; integration tests when you're changing how the SDK talks to the gateway.
4. Run the relevant checks locally (build, tests, lint, typecheck).
5. Open a PR. Use the [PR template](.github/PULL_REQUEST_TEMPLATE.md). Describe the **what** and **why** — the diff shows the **how**.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(langchain): add AgentCCCallbackHandler for unified observability
fix(python): retry on 503 responses from gateway
docs: clarify AGENTCC_BASE_URL format
```

### Style

- Match the surrounding code — formatter settings (ruff, eslint) are the source of truth.
- For docs and READMEs: follow [`docs/VOCABULARY.md`](docs/VOCABULARY.md). Don't call this repo "AgentCC the gateway" — it's the SDKs.
- Don't add comments that restate the code. Add them when the **why** isn't obvious.

---

## What makes a great PR

- **Small and focused.** Under ~400 changed lines is easy to review.
- **Tests.** Every bug fix should come with a test that fails before the fix and passes after.
- **Docs updated.** If a public type, function, or env var changed, update the README and docstrings.
- **No scope creep.** Refactors, formatting fixes, and unrelated cleanups go in separate PRs.
- **No drive-by dependency bumps.** Unless that's explicitly the PR's point.

---

## Releasing

Releases are handled by maintainers. If you want a change shipped, open a PR — we batch releases roughly every two weeks or when a fix is time-sensitive.

---

## Questions?

- Something's unclear in these docs? Open a PR against this file.
- Stuck on setup? Ask in [Discord](https://discord.gg/UjZ2gRT5p) — someone on the team is usually around.
- Want to propose something big? Open a [Discussion](https://github.com/orgs/future-agi/discussions) first so we can talk design before you spend time on a PR.

Thanks for contributing. 🙏
