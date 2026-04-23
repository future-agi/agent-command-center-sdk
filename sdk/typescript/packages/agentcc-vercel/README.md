# @agentcc/vercel

<p>
  <a href="https://www.npmjs.com/package/@agentcc/vercel"><img src="https://img.shields.io/npm/v/@agentcc/vercel?style=flat-square&label=npm" alt="npm"></a>
  <a href="https://github.com/future-agi/agent-command-center/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="Apache 2.0"></a>
</p>

Vercel AI SDK provider for the [Agent Command Center](https://github.com/future-agi/future-agi), Future AGI's open-source AI gateway. Use `generateText`, `streamText`, structured output, and tools through the Vercel AI SDK while every call routes through Agent Command Center's routing, caching, guardrails, and cost tracking.

## Install

```bash
npm install @agentcc/vercel
```

Peer dependencies:

```bash
npm install ai@">=3.0.0" @ai-sdk/openai@">=0.0.40"
```

## Usage

### `generateText`

```typescript
import { createAgentCC } from "@agentcc/vercel";
import { generateText } from "ai";

const agentcc = createAgentCC({
  apiKey: process.env.AGENTCC_API_KEY,
  baseURL: "https://gateway.futureagi.com/v1",
});

const { text } = await generateText({
  model: agentcc("gpt-4o"),
  prompt: "Explain the difference between SSE and WebSockets.",
});
console.log(text);
```

### `streamText`

```typescript
import { streamText } from "ai";

const result = await streamText({
  model: agentcc("gpt-4o"),
  prompt: "Write a short poem about distributed systems.",
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Gateway features

`createAgentCC` accepts gateway options that are automatically serialized as request headers:

```typescript
const agentcc = createAgentCC({
  apiKey: process.env.AGENTCC_API_KEY,
  baseURL: "https://gateway.futureagi.com/v1",
  // Fallback routing: try GPT-4o, fall back to Claude on failure
  config: {
    strategy: "fallback",
    targets: [
      { provider: "openai", model: "gpt-4o" },
      { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    ],
  },
  cacheEnabled: true,
  cacheTtl: "5m",
  guardrailPolicy: "pii-block",
});

const { text } = await generateText({
  model: agentcc("gpt-4o"),
  prompt: "Summarize this document.",
});
```

### Tools

`@agentcc/vercel` is a thin wrapper over `@ai-sdk/openai`, so all Vercel AI SDK features — tools, structured output, multi-step tool loops — work as-is:

```typescript
import { streamText, tool } from "ai";
import { z } from "zod";

const result = await streamText({
  model: agentcc("gpt-4o"),
  prompt: "What is the weather in London?",
  tools: {
    weather: tool({
      description: "Get current weather",
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => ({ temp: 18, unit: "C" }),
    }),
  },
});
```

## Environment variables

| Variable | Description |
|---|---|
| `AGENTCC_API_KEY` | API key (`sk-agentcc-*`) |
| `AGENTCC_GATEWAY_URL` or `AGENTCC_BASE_URL` | Gateway base URL |

## Documentation

- [Full docs](https://docs.futureagi.com/agentcc/integrations/vercel)
- [Gateway docs](https://docs.futureagi.com/docs/command-center)
- [Monorepo README](../../../README.md)

## License

Apache 2.0 — see [LICENSE](../../../LICENSE).
