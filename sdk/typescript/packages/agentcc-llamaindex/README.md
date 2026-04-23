# @agentcc/llamaindex

<p>
  <a href="https://www.npmjs.com/package/@agentcc/llamaindex"><img src="https://img.shields.io/npm/v/@agentcc/llamaindex?style=flat-square&label=npm" alt="npm"></a>
  <a href="https://github.com/future-agi/agent-command-center/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="Apache 2.0"></a>
</p>

LlamaIndex.TS integration for the [Agent Command Center](https://github.com/future-agi/future-agi), Future AGI's open-source AI gateway. Ships `AgentCCLLM` and `AgentCCEmbedding` — implementations of LlamaIndex's `LLM` and `BaseEmbedding` interfaces — so any LlamaIndex pipeline can route through the gateway with routing, caching, and guardrails intact.

## Install

```bash
npm install @agentcc/llamaindex
```

Peer dependencies:

```bash
npm install llamaindex@">=0.3.0" @agentcc/client@">=0.1.0"
```

## Usage

### LLM

```typescript
import { AgentCCLLM } from "@agentcc/llamaindex";

const llm = new AgentCCLLM({
  agentccApiKey: process.env.AGENTCC_API_KEY,
  agentccBaseUrl: "https://gateway.futureagi.com/v1",
  model: "gpt-4o",
  temperature: 0,
});

// Single-turn chat
const response = await llm.chat({
  messages: [{ role: "user", content: "What is RAG?" }],
});
console.log(response.message.content);
```

### Streaming

```typescript
const stream = llm.chatStream({
  messages: [{ role: "user", content: "Explain embeddings step by step." }],
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta);
}
```

### Embeddings

```typescript
import { AgentCCEmbedding } from "@agentcc/llamaindex";

const embedder = new AgentCCEmbedding({
  agentccApiKey: process.env.AGENTCC_API_KEY,
  agentccBaseUrl: "https://gateway.futureagi.com/v1",
  model: "text-embedding-3-small",
});

const vector = await embedder.getTextEmbedding("Hello, world");
```

Pass `llm` and `embedModel` into any LlamaIndex pipeline (indices, query engines, agents) and every call routes through Agent Command Center.

## Documentation

- [Full docs](https://docs.futureagi.com/agentcc/integrations/llamaindex)
- [Gateway docs](https://docs.futureagi.com/docs/command-center)
- [Monorepo README](../../../README.md)

## License

Apache 2.0 — see [LICENSE](../../../LICENSE).
