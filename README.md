<!--
╔═════════════════════════════════════════════════════════════════════════════╗
║  MARKETING NOTES FOR IMAGE ASSETS                                           ║
║                                                                             ║
║  Assets live under .github/assets/. Specs + intent are inlined above each   ║
║  <img> tag as HTML comments. Ship light + dark variants via <picture> for   ║
║  any image that contains a UI screenshot. Total asset budget < 12 MB.       ║
║  PNG for static, GIF only where called out.                                 ║
╚═════════════════════════════════════════════════════════════════════════════╝
-->

<div align="center">

<!--
  [MARKETING] logo-banner.png / logo-banner-dark.png
  What:    Future AGI wordmark + tagline "Client SDKs for the
           Agent Command Center" — centered, brand colors.
  Size:    1600 × 400, PNG, transparent background.
  Variants: light + dark via <picture>.
-->
<a href="https://futureagi.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-banner-dark.png">
    <img alt="Future AGI — Client SDKs for the Agent Command Center" src=".github/assets/logo-banner.png" height="120">
  </picture>
</a>

# Client SDKs for the Agent Command Center

**Python and TypeScript SDKs — plus LangChain, LlamaIndex, React, and Vercel AI SDK integrations — for [Agent Command Center](https://github.com/future-agi/future-agi), Future AGI's open-source, OpenAI-compatible AI gateway.**

<p>
  <a href="https://github.com/future-agi/agent-command-center/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="Apache 2.0"></a>
  <a href="https://pypi.org/project/agentcc/"><img src="https://img.shields.io/pypi/v/agentcc?style=flat-square&label=pypi" alt="PyPI"></a>
  <a href="https://www.npmjs.com/package/@agentcc/client"><img src="https://img.shields.io/npm/v/@agentcc/client?style=flat-square&label=npm" alt="npm"></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/python-3.9+-blue?style=flat-square" alt="Python 3.9+"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-18+-green?style=flat-square" alt="Node 18+"></a>
  <a href="https://discord.gg/UjZ2gRT5p"><img src="https://img.shields.io/badge/discord-join-5865F2?style=flat-square" alt="Discord"></a>
  <a href="https://github.com/future-agi/agent-command-center/stargazers"><img src="https://img.shields.io/github/stars/future-agi/agent-command-center?style=flat-square&color=yellow" alt="GitHub stars"></a>
</p>

<p>
  <a href="#-quickstart"><b>Quickstart</b></a> ·
  <a href="https://github.com/future-agi/future-agi"><b>Gateway repo</b></a> ·
  <a href="https://docs.futureagi.com"><b>Docs</b></a> ·
  <a href="https://app.futureagi.com/auth/jwt/register"><b>Try Cloud (Free)</b></a> ·
  <a href="https://discord.gg/UjZ2gRT5p"><b>Discord</b></a> ·
  <a href="https://github.com/orgs/future-agi/discussions"><b>Discussions</b></a>
</p>

</div>

---

## What's in here

This repo ships the **client SDKs** for the Agent Command Center. The gateway itself — the Go service that handles routing, caching, guardrails, cost tracking, and the OpenAI-compatible endpoint — lives in the [`future-agi/future-agi`](https://github.com/future-agi/future-agi) platform monorepo. These SDKs give you typed Python and TypeScript clients, plus integrations for LangChain, LlamaIndex, React, and the Vercel AI SDK.

If you already know OpenAI's SDK, you already know these. Swap `OpenAI` for `AgentCC`, point `base_url` at the gateway, and every gateway feature — multi-provider routing, semantic caching, inline guardrails, per-key budgets — is available through the same call.

---

---
## Packages

| Package | Runtime | Install | Purpose |
|---|---|---|---|
| [`agentcc`](sdk/python) | Python 3.9+ | `pip install agentcc` | Core Python client — sync + async, streaming, tools, structured output |
| [`@agentcc/client`](sdk/typescript) | Node 18+ | `npm install @agentcc/client` | Core TypeScript client — ESM + CJS, fully typed |
| [`@agentcc/langchain`](sdk/typescript/packages/agentcc-langchain) | Node 18+ | `npm install @agentcc/langchain` | Drop-in `ChatOpenAI` replacement for LangChain.js |
| [`@agentcc/llamaindex`](sdk/typescript/packages/agentcc-llamaindex) | Node 18+ | `npm install @agentcc/llamaindex` | LLM + embedding integration for LlamaIndex.TS |
| [`@agentcc/react`](sdk/typescript/packages/agentcc-react) | Node 18+ | `npm install @agentcc/react` | React context + hooks for chat UIs |
| [`@agentcc/vercel`](sdk/typescript/packages/agentcc-vercel) | Node 18+ | `npm install @agentcc/vercel` | Vercel AI SDK provider |

---

## Features

- **OpenAI-compatible surface.** Chat, completions, embeddings, images, audio, moderations, files, batches, rerank, responses — same shape as OpenAI's SDK. Migrating is a one-line change.
- **100+ providers through one endpoint.** OpenAI, Anthropic, Google, Vertex AI, Bedrock, Azure, Groq, Together, Mistral, Fireworks, Ollama, vLLM — whatever you pick, your SDK call doesn't change.
- **15 routing strategies, surfaced per request.** Fallback chains, shadow traffic, latency-aware routing, cost-optimised selection, circuit breakers — configured via a typed `config` option or gateway-side virtual keys.
- **Streaming, tool calling, structured output.** Iterator patterns in Python, async iterables in TypeScript — both fully typed.
- **Inline guardrails + cost tracking.** Every request can carry a guardrail policy and a budget header. The gateway enforces both; the SDK surfaces the results.
- **Framework integrations that don't rewrap.** `@agentcc/langchain` is a genuine `BaseChatModel`. `@agentcc/vercel` is a real AI SDK provider. `@agentcc/llamaindex` implements LlamaIndex's `LLM` and `BaseEmbedding`. Use them the way you use the originals.

---

## <a name="-quickstart"></a>🚀 Quickstart

Get a key at [app.futureagi.com](https://app.futureagi.com/auth/jwt/register) (free tier available) or [self-host the gateway](https://github.com/future-agi/future-agi) — then:

<table>
<tr>
<td width="50%" valign="top">

**Python**

```bash
pip install agentcc
```

```python
import os
from agentcc import AgentCC

client = AgentCC(
    api_key=os.environ["AGENTCC_API_KEY"],
    base_url="https://gateway.futureagi.com/v1",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

</td>
<td width="50%" valign="top">

**TypeScript**

```bash
npm install @agentcc/client
```

```typescript
import { AgentCC } from "@agentcc/client";

const client = new AgentCC({
  apiKey: process.env.AGENTCC_API_KEY,
  baseUrl: "https://gateway.futureagi.com/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);
```

</td>
</tr>
</table>

<sub>Set `AGENTCC_API_KEY` and `AGENTCC_BASE_URL` in your environment and both clients pick them up automatically.</sub>

---

## Gateway features through the SDK

Everything the gateway supports — routing strategies, caching, guardrails, budgets — is available per request via a `config` option. No separate API to learn.

```typescript
import { AgentCC, type GatewayConfig } from "@agentcc/client";

const config: GatewayConfig = {
  strategy: "fallback",
  targets: [
    { provider: "openai", model: "gpt-4o" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  ],
};

const client = new AgentCC({
  apiKey: process.env.AGENTCC_API_KEY,
  baseUrl: "https://gateway.futureagi.com/v1",
  config,
});
```

<sub>[Gateway docs →](https://docs.futureagi.com/docs/command-center) · [Routing strategies →](https://docs.futureagi.com/docs/command-center/features/routing) · [Guardrails →](https://docs.futureagi.com/docs/command-center/features/guardrails)</sub>

---

## Framework integrations

| Package | What you get |
|---|---|
| [`@agentcc/langchain`](sdk/typescript/packages/agentcc-langchain) | `ChatAgentCC` (drop-in `ChatOpenAI`), `AgentCCEmbeddings`, `AgentCCCallbackHandler` for unified observability across LangChain + gateway |
| [`@agentcc/llamaindex`](sdk/typescript/packages/agentcc-llamaindex) | `AgentCCLLM`, `AgentCCEmbedding` — pass them to any LlamaIndex pipeline that accepts an LLM or embedding model |
| [`@agentcc/react`](sdk/typescript/packages/agentcc-react) | `AgentCCProvider`, `useAgentCCChat` (streaming), `useAgentCCCompletion`, `useAgentCCObject` (structured output) |
| [`@agentcc/vercel`](sdk/typescript/packages/agentcc-vercel) | `createAgentCC()` provider for `generateText` / `streamText` — tools, structured output, and multi-step loops pass through |

Each integration has its own README with full examples.

---

## Related Future AGI repos

These SDKs are one slice of the [Future AGI](https://futureagi.com) platform — an open-source stack for making AI agents reliable. You can use them standalone against any Agent Command Center deployment, or alongside the rest.

| Repo | What it is |
|---|---|
| [`future-agi/future-agi`](https://github.com/future-agi/future-agi) | Platform monorepo — the gateway itself, evaluations, simulations, tracing, prompt optimization |
| [`future-agi/traceAI`](https://github.com/future-agi/traceAI) | OpenTelemetry-native instrumentation for 50+ AI frameworks |
| [`future-agi/ai-evaluation`](https://github.com/future-agi/ai-evaluation) | 50+ evaluation metrics + guardrail scanners |
| [`future-agi/agent-opt`](https://github.com/future-agi/agent-opt) | Six prompt-optimization algorithms (GEPA, PromptWizard, and more) |

---

## Requirements

- **Python 3.9+** — for `agentcc`
- **Node 18+** — for all `@agentcc/*` packages
- **An Agent Command Center endpoint** — either [Future AGI Cloud](https://app.futureagi.com/auth/jwt/register) (free tier) or a [self-hosted gateway](https://github.com/future-agi/future-agi)

---

## Documentation

- [Full docs](https://docs.futureagi.com) — product overview, concepts, tutorials
- [Python SDK reference](sdk/python/README.md)
- [TypeScript SDK reference](sdk/typescript/README.md)
- [Gateway docs](https://docs.futureagi.com/docs/command-center) — routing, caching, guardrails, budgets
- [Cookbook](https://docs.futureagi.com/docs/cookbook) — end-to-end recipes

---

## 🤝 Contributing

Contributions welcome — bug fixes, new framework integrations, examples, docs improvements, anything.

1. Browse [`good first issue`](https://github.com/future-agi/agent-command-center/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
2. Read the [Contributing Guide](CONTRIBUTING.md)
3. Say hi on [Discord](https://discord.gg/UjZ2gRT5p) or [Discussions](https://github.com/orgs/future-agi/discussions)

Security reports: see [SECURITY.md](SECURITY.md).

---

## 🌍 Community & support

| | |
|---|---|
| 💬 [**Discord**](https://discord.gg/UjZ2gRT5p) | Real-time help from the team and community |
| 🗨️ [**GitHub Discussions**](https://github.com/orgs/future-agi/discussions) | Ideas, questions, roadmap input |
| 🐦 [**Twitter / X**](https://twitter.com/futureagi) | Release announcements |
| 📝 [**Blog**](https://futureagi.com/blog) | Engineering & research posts |
| 📧 **support@futureagi.com** | Cloud account / billing |
| 🔐 **security@futureagi.com** | Private vulnerability disclosure (24 h ack — see [SECURITY.md](SECURITY.md)) |

---

## ⭐ Star history

<a href="https://star-history.com/#future-agi/agent-command-center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=future-agi/agent-command-center&type=Date&theme=dark">
    <img alt="Star history" src="https://api.star-history.com/svg?repos=future-agi/agent-command-center&type=Date">
  </picture>
</a>

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE).

---

<div align="center">

Made by the [Future AGI](https://futureagi.com) team and [contributors](https://github.com/future-agi/agent-command-center/graphs/contributors).

[futureagi.com](https://futureagi.com) · [docs.futureagi.com](https://docs.futureagi.com) · [app.futureagi.com](https://app.futureagi.com)

</div>
