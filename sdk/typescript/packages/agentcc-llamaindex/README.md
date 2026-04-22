# @agentcc/llamaindex

LlamaIndex.TS integration for the AgentCC gateway. Provides `AgentCCLLM` and `AgentCCEmbedding` classes that implement the LlamaIndex LLM and BaseEmbedding interfaces, routing all calls through the AgentCC gateway.

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

Pass `llm` and `embedModel` to any LlamaIndex pipeline that accepts those options to route through the AgentCC gateway with routing, caching, and guardrails intact.

## Documentation

[https://docs.futureagi.com](https://docs.futureagi.com)

## License

Apache 2.0 — see [LICENSE](../../../LICENSE).
