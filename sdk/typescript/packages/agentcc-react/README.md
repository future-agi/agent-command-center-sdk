# @agentcc/react

React hooks and context for building AI chat UIs backed by the AgentCC gateway. Provides `AgentCCProvider` for client injection and `useAgentCCChat`, `useAgentCCCompletion`, and `useAgentCCObject` hooks for common interaction patterns.

## Install

```bash
npm install @agentcc/react
```

Peer dependencies:

```bash
npm install react@">=18.0.0" @agentcc/client@">=0.1.0"
```

## Usage

### Wrap your app with `AgentCCProvider`

```tsx
import { AgentCC } from "@agentcc/client";
import { AgentCCProvider } from "@agentcc/react";

const client = new AgentCC({
  apiKey: process.env.AGENTCC_API_KEY,
  baseUrl: "https://gateway.futureagi.com/v1",
});

function App() {
  return (
    <AgentCCProvider client={client}>
      <ChatPage />
    </AgentCCProvider>
  );
}
```

### `useAgentCCChat` — streaming conversation hook

```tsx
import { useAgentCCChat } from "@agentcc/react";

function ChatPage() {
  const { messages, input, setInput, handleSubmit, isLoading, stop } =
    useAgentCCChat({ model: "gpt-4o" });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>Send</button>
        {isLoading && <button type="button" onClick={stop}>Stop</button>}
      </form>
    </div>
  );
}
```

`useAgentCCChat` manages conversation state, streams responses token-by-token, and exposes `stop`, `reload`, and `append` for full control.

### `useAgentCCObject` — structured output hook

```tsx
import { useAgentCCObject } from "@agentcc/react";

function SummaryPage() {
  const { object, submit, isLoading } = useAgentCCObject<{ summary: string }>({
    model: "gpt-4o",
    schema: {
      type: "object",
      properties: { summary: { type: "string" } },
      required: ["summary"],
    },
    schemaName: "Summary",
  });

  return (
    <div>
      <button onClick={() => submit("Summarize the history of computing.")}>
        Summarize
      </button>
      {isLoading && <p>Loading...</p>}
      {object && <p>{object.summary}</p>}
    </div>
  );
}
```

## Exports

| Export | Description |
|---|---|
| `AgentCCProvider` | React context provider |
| `useAgentCCClient` | Access the client from context |
| `useAgentCCChat` | Streaming chat hook |
| `useAgentCCChatWithClient` | Same hook, accepts explicit client (for testing) |
| `useAgentCCCompletion` | Single-turn completion hook |
| `useAgentCCCompletionWithClient` | Same hook, accepts explicit client |
| `useAgentCCObject` | Structured output hook |
| `useAgentCCObjectWithClient` | Same hook, accepts explicit client |

## Documentation

[https://docs.futureagi.com](https://docs.futureagi.com)

## License

Apache 2.0 — see [LICENSE](../../../LICENSE).
