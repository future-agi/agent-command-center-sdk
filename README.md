<div align="center">

![Company Logo](Logo.png)

# AgentCC SDK

</div>

---

AgentCC is an AI gateway that sits between your application and LLM providers, offering an OpenAI-compatible REST API at `https://gateway.futureagi.com/v1`. This monorepo contains the official client SDKs for Python and TypeScript, along with framework integrations for LangChain.js, LlamaIndex.TS, React, and the Vercel AI SDK.
<div align="center">
  <img src="command-repo.gif" alt="AgentCC Demo" width="70%" />
</div>

---
## Packages

| Package | Runtime | Install | Purpose |
|---|---|---|---|
| `agentcc` | Python 3.9+ | `pip install agentcc` | Core Python client |
| `@agentcc/client` | Node 18+ | `npm install @agentcc/client` | Core TypeScript client |
| `@agentcc/langchain` | Node 18+ | `npm install @agentcc/langchain` | Drop-in `ChatOpenAI` replacement for LangChain.js |
| `@agentcc/llamaindex` | Node 18+ | `npm install @agentcc/llamaindex` | LlamaIndex.TS LLM and embedding integration |
| `@agentcc/react` | Node 18+ | `npm install @agentcc/react` | React hooks and context for chat UIs |
| `@agentcc/vercel` | Node 18+ | `npm install @agentcc/vercel` | Vercel AI SDK provider |

## Quick start

**Python**

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

**TypeScript**

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

## Requirements

- Python 3.9+ (for `agentcc`)
- Node 18+ (for `@agentcc/*` packages)

## Documentation

Full documentation is at [https://docs.futureagi.com](https://docs.futureagi.com).

Per-package READMEs:
- [Python SDK](sdk/python/README.md)
- [TypeScript SDK](sdk/typescript/README.md)
- [@agentcc/langchain](sdk/typescript/packages/agentcc-langchain/README.md)
- [@agentcc/llamaindex](sdk/typescript/packages/agentcc-llamaindex/README.md)
- [@agentcc/react](sdk/typescript/packages/agentcc-react/README.md)
- [@agentcc/vercel](sdk/typescript/packages/agentcc-vercel/README.md)

## License

Apache 2.0 — see [LICENSE](LICENSE).
