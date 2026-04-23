# Future AGI — Shared Vocabulary & Style Guide

> Canonical names, voice, and boilerplate shared across the three Future AGI open-source repos:
> [`future-agi/future-agi`](https://github.com/future-agi/future-agi) (platform monorepo),
> [`future-agi/agent-command-center`](https://github.com/future-agi/agent-command-center) (gateway client SDKs),
> and the web frontend repo.
>
> **If you're writing user-facing prose in any of these repos, read this first.**

---

## Names & casing

| Term | When to use | Examples |
|---|---|---|
| **Future AGI** | The company and the open-source platform. Two words, title case. | "Future AGI is the open-source platform for making AI agents reliable." |
| **Agent Command Center** | The AI gateway product (full name, title case). Use this when introducing the gateway. | "The Agent Command Center is Future AGI's OpenAI-compatible AI gateway." |
| **agentcc** | The gateway's package/code namespace. Lowercase. Use in install commands, package names, imports, env vars, URLs. | `pip install agentcc`, `@agentcc/client`, `AGENTCC_API_KEY`, `sk-agentcc-*` |
| **AgentCC** | CamelCase — **only** the Python/TS client class name. Don't use in prose. | `from agentcc import AgentCC`, `new AgentCC({ ... })` |
| **futureagi** | One word, lowercase — **only** in domain/URL segments. | `docs.futureagi.com`, `gateway.futureagi.com`, `app.futureagi.com` |
| **traceAI** | The OpenTelemetry instrumentation SDK family. | `pip install fi-instrumentation-otel`, `@traceai/fi-core` |

### Banned terms

These are old internal names. They **must not** appear in any public-facing file (README, docs, comments that ship in packaged code, PR titles, release notes):

- **Prism** / `prism` — former internal name for the gateway. Replaced by Agent Command Center / `agentcc`.
- **Wire** / `wire-protocol` — former internal name for the gateway's request format. It's just the gateway's HTTP API now.

If you find one, fix it.

---

## What the SDK repo is (pick the right length)

The `agent-command-center` repo sometimes gets pitched as a gateway itself. **It isn't.** The gateway code lives in the [`future-agi`](https://github.com/future-agi/future-agi) monorepo at `futureagi/agentcc-gateway/`. This repo ships the **client SDKs** that talk to that gateway.

Use one of these lines — don't invent new phrasing.

**One-liner (hero tagline)**
> Client SDKs for the Agent Command Center — Future AGI's open-source AI gateway.

**Short (under badges / social preview)**
> Python and TypeScript SDKs — plus LangChain, LlamaIndex, React, and Vercel AI SDK integrations — for the Agent Command Center, Future AGI's open-source, OpenAI-compatible AI gateway.

**Paragraph (README intro)**
> This monorepo contains the official client SDKs for the [Agent Command Center](https://github.com/future-agi/future-agi), Future AGI's open-source AI gateway. The gateway gives you one OpenAI-compatible endpoint in front of 100+ providers, with routing, caching, guardrails, and cost tracking. These SDKs let Python and TypeScript apps call it with typed clients, streaming, tools, and first-class integrations for LangChain, LlamaIndex, React, and the Vercel AI SDK.

---

## What the gateway is (pick the right length)

For the gateway README / docs / blog posts, when introducing Agent Command Center itself.

**One-liner**
> One OpenAI-compatible endpoint in front of 100+ LLM providers — with routing, caching, guardrails, and cost tracking built in.

**Short**
> The Agent Command Center is an open-source, Go-based AI gateway. One OpenAI-compatible endpoint sits in front of 100+ hosted and self-hosted LLM providers. 15 routing strategies, exact + semantic caching, 18 built-in guardrails, virtual keys, budgets, rate limits — all configurable per request.

**Paragraph**
> Agent Command Center is Future AGI's open-source AI gateway. It exposes a single OpenAI-compatible endpoint that routes to 100+ providers (OpenAI, Anthropic, Google, Bedrock, Azure, plus self-hosted Ollama, vLLM, and more). You get 15 routing strategies — latency-aware, cost-optimised, shadow, failover, circuit-breaker — exact and semantic caching across 10 backends, 18 built-in guardrails plus 15 vendor adapters, and virtual keys with per-key budgets and rate limits. Benchmarked at ~29 k req/s sustained at 100% success with P99 ≤ 21 ms, ~2.8 ms P95 end-to-end at ~1 k RPS.

---

## URL conventions

| URL | What it is |
|---|---|
| `https://gateway.futureagi.com/v1` | Production gateway endpoint. `/v1` is part of the base URL in SDK examples. |
| `https://app.futureagi.com` | Cloud app (login, dashboards, key management). |
| `https://docs.futureagi.com` | Full product documentation. |
| `https://futureagi.com` | Marketing site. |
| `https://status.futureagi.com` | Cloud status page. |
| `https://github.com/future-agi/future-agi` | Platform monorepo (gateway, dashboard, eval, simulate). |
| `https://github.com/future-agi/agent-command-center` | Gateway client SDKs (this repo family). |

---

## Code-sample conventions

Consistent code across READMEs makes the three repos feel like one product.

**Env vars (always these names, this casing)**

```
AGENTCC_API_KEY       # API key, prefixed sk-agentcc-
AGENTCC_BASE_URL      # Gateway URL, e.g. https://gateway.futureagi.com/v1
```

**Example API key format in snippets**

```
sk-agentcc-EXAMPLE0000000000000000000000
```

Never paste a real key. Never use `sk-...` or `YOUR_API_KEY` placeholders — use the `sk-agentcc-EXAMPLE...` form so readers instantly see what shape to expect.

**Example models in snippets**

- Chat: `gpt-4o` (production), `gpt-4o-mini` (cheap, for tests)
- Embeddings: `text-embedding-3-small`
- Anthropic fallback demo: `claude-sonnet-4-20250514`

Using the same three everywhere means the reader isn't spending effort parsing model strings.

**Example prompts**

Favour prompts that are useful *and* short: `"Summarize the theory of relativity."`, `"Write a haiku about programming."`, `"What is the weather in Paris?"`. Avoid "Hello, world" in production-looking code; use it only in a minimal smoke test.

**Language blocks** — always label them: `python`, `typescript`, `tsx`, `bash`, `yaml`, `toml`. Never raw code fences.

---

## README section patterns

Every user-facing README in the three repos should follow roughly this order. Skip sections that don't apply, but keep the order.

1. Hero: logo/wordmark → one-liner → short paragraph
2. Badges row (see below)
3. Navigation row (links to Docs, Discord, Discussions, related repos)
4. **Why** (or positioning) — two short paragraphs
5. **Features / pillars** — bullets or 3-column table
6. **Quickstart** — under a minute, copy-pasteable
7. **Architecture / API surface** — wherever a reader asks "okay, what does it expose?"
8. **Integrations / related packages** — table
9. **Deployment** (platform repo) / **Requirements** (SDKs)
10. **Contributing** — link, not inline prose
11. **Community & support** — emoji table
12. **License** — one paragraph + link

Use `<sub>` tags for secondary link rows under a section:

```markdown
<sub>[Full docs →](https://docs.futureagi.com) · [Cookbooks →](https://docs.futureagi.com/docs/cookbook)</sub>
```

Use `<table>` for 2- and 3-column comparison blurbs. Use `<details>` for long secondary content the casual reader can skip.

---

## Badges

Copy this block (or the subset that applies). Keep flat-square style across all three repos.

```markdown
<a href="https://github.com/future-agi/agent-command-center/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="Apache 2.0"></a>
<a href="https://pypi.org/project/agentcc/"><img src="https://img.shields.io/pypi/v/agentcc?style=flat-square&label=pypi" alt="PyPI"></a>
<a href="https://www.npmjs.com/package/@agentcc/client"><img src="https://img.shields.io/npm/v/@agentcc/client?style=flat-square&label=npm" alt="npm"></a>
<a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/python-3.9+-blue?style=flat-square" alt="Python 3.9+"></a>
<a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-18+-green?style=flat-square" alt="Node 18+"></a>
<a href="https://discord.gg/UjZ2gRT5p"><img src="https://img.shields.io/badge/discord-join-5865F2?style=flat-square" alt="Discord"></a>
<a href="https://github.com/future-agi/agent-command-center/stargazers"><img src="https://img.shields.io/github/stars/future-agi/agent-command-center?style=flat-square&color=yellow" alt="GitHub stars"></a>
```

---

## Voice & tone

- **Concrete over abstract.** "~29 k req/s at P99 ≤ 21 ms" beats "high-performance." Numbers are load-bearing in this voice.
- **Present tense, active voice.** "The gateway routes requests" — not "requests are routed by the gateway."
- **Second person ("you") for the reader.** "You get one endpoint in front of 100+ providers."
- **Short sentences carry weight.** If a sentence runs past ~25 words, consider splitting.
- **Em-dashes are house style.** Don't replace them with commas to "look less AI-generated." Overuse within a single paragraph is the problem, not the dash itself.
- **No hedging.** "Typically," "generally," "often," "perhaps" are usually deletable.
- **Sell the number, cite the source.** Every benchmark claim links to the reproducible harness. Every comparison links to the competitor's docs.
- **Emoji labels are fine** in community / support / roadmap tables. They're not fine in feature prose.

---

## Things to never do

- Never describe this SDK repo as "an AI gateway." It's the **client SDKs** for one.
- Never use `sk-...` or `YOUR_KEY_HERE` as an example key. Use `sk-agentcc-EXAMPLE...`.
- Never commit real API keys, even expired ones.
- Never leave `TODO` / `FIXME` / `XXX` in a user-facing README on `main`.
- Never refer to "Prism" or "Wire" by those names in public files.
- Never write `@AgentCC/Client` or `AgentCC/client` — the npm scope is lowercase `@agentcc`.

---

## Asset conventions

Image assets live in `.github/assets/` in each repo, referenced via `<picture>` for automatic dark-mode swaps:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/<name>-dark.png">
  <img alt="<description>" src=".github/assets/<name>.png">
</picture>
```

Asset budget per repo: **under 12 MB** total. PNG for static screenshots, GIF only where explicitly called out. Put `[MARKETING]` HTML comments above every `<img>` with the intended content so design/marketing can swap stubs for final art without re-reading the README.

---

## Updating this doc

This file is copied verbatim into the other two repos. If you edit it, edit all three (or open an issue so the other repos track the change). Changes to product names, URL patterns, or example-code conventions are particularly important to keep in sync.
