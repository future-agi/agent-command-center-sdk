# @agentcc/langchain

LangChain.js integration for the AgentCC gateway. Provides `ChatAgentCC`, a drop-in replacement for `ChatOpenAI`, so any LangChain chain or agent can route through AgentCC with no structural changes.

## Install

```bash
npm install @agentcc/langchain
```

Peer dependencies:

```bash
npm install @langchain/core@">=0.2.0" @agentcc/client@">=0.1.0"
```

## Usage

### Chat model

```typescript
import { ChatAgentCC } from "@agentcc/langchain";

const model = new ChatAgentCC({
  agentccApiKey: process.env.AGENTCC_API_KEY,
  agentccBaseUrl: "https://gateway.futureagi.com/v1",
  model: "gpt-4o",
  temperature: 0,
});

// Works in any LangChain chain — invoke, batch, stream all supported
const result = await model.invoke([
  { _getType: () => "human", content: "Explain gradient descent in one sentence." },
]);
console.log(result.text);
```

### Streaming

```typescript
const model = new ChatAgentCC({
  agentccApiKey: process.env.AGENTCC_API_KEY,
  agentccBaseUrl: "https://gateway.futureagi.com/v1",
  model: "gpt-4o",
  streaming: true,
});

const stream = await model.stream([
  { _getType: () => "human", content: "Write a haiku about programming." },
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### Embeddings

```typescript
import { AgentCCEmbeddings } from "@agentcc/langchain";

const embeddings = new AgentCCEmbeddings({
  agentccApiKey: process.env.AGENTCC_API_KEY,
  agentccBaseUrl: "https://gateway.futureagi.com/v1",
  model: "text-embedding-3-small",
});

const vectors = await embeddings.embedDocuments(["hello", "world"]);
```

### Callback handler

`AgentCCCallbackHandler` bridges LangChain callback events to AgentCC's callback system, enabling unified observability across both layers:

```typescript
import { AgentCCCallbackHandler } from "@agentcc/langchain";
import type { CallbackHandler } from "@agentcc/client";

// Pass your AgentCC callback handlers (e.g. a logging handler)
const agentccCallbacks: CallbackHandler[] = [/* ... */];
const handler = new AgentCCCallbackHandler({ callbacks: agentccCallbacks });

// Use handler with LangChain's callback system
await model.invoke([...], { callbacks: [handler] });
```

## Documentation

[https://docs.futureagi.com](https://docs.futureagi.com)

## License

Apache 2.0 — see [LICENSE](../../../LICENSE).
