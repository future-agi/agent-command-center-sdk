# @agentcc/client

<p>
  <a href="https://www.npmjs.com/package/@agentcc/client"><img src="https://img.shields.io/npm/v/@agentcc/client?style=flat-square&label=npm" alt="npm"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-18+-green?style=flat-square" alt="Node 18+"></a>
  <a href="https://github.com/future-agi/agent-command-center/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="Apache 2.0"></a>
</p>

TypeScript SDK for the [Agent Command Center](https://github.com/future-agi/future-agi), Future AGI's open-source, OpenAI-compatible AI gateway. Fully typed, ESM and CJS, Node 18+. Plus a family of framework integrations: LangChain, LlamaIndex, React, and the Vercel AI SDK.

## Install

```bash
npm install @agentcc/client
# or
pnpm add @agentcc/client
# or
yarn add @agentcc/client
```

## Usage

### Basic chat completion

```typescript
import { AgentCC } from "@agentcc/client";

const client = new AgentCC({
  apiKey: process.env.AGENTCC_API_KEY,
  baseUrl: "https://gateway.futureagi.com/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Summarize the theory of relativity." }],
});
console.log(response.choices[0].message.content);
```

The client reads `AGENTCC_API_KEY` and `AGENTCC_BASE_URL` from the environment when those options are not passed explicitly.

### Streaming

```typescript
const stream = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Write a haiku about programming." }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) process.stdout.write(delta);
}
```

### Tool calling

```typescript
const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "What's the weather in Paris?" }],
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather for a location.",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" },
            unit: { type: "string", enum: ["celsius", "fahrenheit"] },
          },
          required: ["location"],
        },
      },
    },
  ],
});

const toolCalls = response.choices[0].message.tool_calls;
if (toolCalls) {
  for (const tc of toolCalls) {
    const args = JSON.parse(tc.function.arguments);
    // call your function, then send the result back as a tool message
  }
}
```

### Gateway features

`ClientOptions` accepts a `config` object for gateway-level routing, caching, and guardrails:

```typescript
import { AgentCC } from "@agentcc/client";
import type { GatewayConfig } from "@agentcc/client";

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

## API surface

| Resource | Access path |
|---|---|
| Chat completions | `client.chat.completions` |
| Legacy completions | `client.completions` |
| Embeddings | `client.embeddings` |
| Images | `client.images` |
| Audio | `client.audio` |
| Models | `client.models` |
| Moderations | `client.moderations` |
| Files | `client.files` |
| Batches | `client.batches` |
| Rerank | `client.rerank` |

## Framework integrations

| Package | Description |
|---|---|
| [`@agentcc/langchain`](packages/agentcc-langchain/README.md) | Drop-in `ChatOpenAI` replacement for LangChain.js chains |
| [`@agentcc/llamaindex`](packages/agentcc-llamaindex/README.md) | LLM and embedding classes for LlamaIndex.TS pipelines |
| [`@agentcc/react`](packages/agentcc-react/README.md) | React context, `useAgentCCChat`, and related hooks for chat UIs |
| [`@agentcc/vercel`](packages/agentcc-vercel/README.md) | Vercel AI SDK provider for `generateText` / `streamText` |

## Environment variables

| Variable | Description |
|---|---|
| `AGENTCC_API_KEY` | API key (`sk-agentcc-*`) |
| `AGENTCC_BASE_URL` | Gateway base URL (e.g. `https://gateway.futureagi.com/v1`) |

## Documentation

- [Full docs](https://docs.futureagi.com/agentcc/sdk/typescript)
- [Gateway docs](https://docs.futureagi.com/docs/command-center)
- [Monorepo README](../../README.md)

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
