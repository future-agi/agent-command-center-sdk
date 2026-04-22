import { describe, it, expect, vi } from "vitest";
import { AgentCCLLM } from "../src/llm.js";

function mockFetchResponse(content: string) {
  return vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: "chatcmpl-1",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
}

describe("AgentCCLLM", () => {
  it("creates instance with default model", () => {
    const llm = new AgentCCLLM({ agentccApiKey: "sk-test" });
    expect(llm.metadata.model).toBe("gpt-4o");
    expect(llm.client).toBeDefined();
  });

  it("creates instance with custom model", () => {
    const llm = new AgentCCLLM({ model: "claude-3-opus" });
    expect(llm.metadata.model).toBe("claude-3-opus");
  });

  it("chat() returns LlamaIndex ChatResponse", async () => {
    const mockFetch = mockFetchResponse("Hello from AgentCC!");
    const llm = new AgentCCLLM({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await llm.chat({
      messages: [{ role: "user", content: "Hi!" }],
    });

    expect(result.message.role).toBe("assistant");
    expect(result.message.content).toBe("Hello from AgentCC!");
    expect(result.raw).toBeDefined();
  });

  it("chat() sends correct messages to API", async () => {
    const mockFetch = mockFetchResponse("ok");
    const llm = new AgentCCLLM({
      agentccApiKey: "sk-test",
      temperature: 0.5,
      maxTokens: 200,
      clientOptions: { fetch: mockFetch },
    });

    await llm.chat({
      messages: [
        { role: "system", content: "You are helpful." },
        { role: "user", content: "Hello" },
      ],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].role).toBe("user");
    expect(body.temperature).toBe(0.5);
    expect(body.max_tokens).toBe(200);
  });

  it("complete() wraps prompt as user message", async () => {
    const mockFetch = mockFetchResponse("Completed text");
    const llm = new AgentCCLLM({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await llm.complete({ prompt: "Tell me a joke" });

    expect(result.text).toBe("Completed text");
    expect(result.raw).toBeDefined();

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
    expect(body.messages[0].content).toBe("Tell me a joke");
  });

  it("metadata exposes model config", () => {
    const llm = new AgentCCLLM({
      model: "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 500,
    });

    expect(llm.metadata).toEqual({
      model: "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 500,
    });
  });
});
