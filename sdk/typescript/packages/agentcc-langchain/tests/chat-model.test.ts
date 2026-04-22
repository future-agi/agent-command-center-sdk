import { describe, it, expect, vi } from "vitest";
import { ChatAgentCC } from "../src/chat-model.js";
import type { LangChainMessage } from "../src/chat-model.js";

function makeHumanMessage(content: string): LangChainMessage {
  return { _getType: () => "human", content };
}

function makeSystemMessage(content: string): LangChainMessage {
  return { _getType: () => "system", content };
}

function mockFetchResponse(content: string, usage?: Record<string, number>) {
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
        usage: usage ?? { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
}

describe("ChatAgentCC", () => {
  it("creates instance with default model", () => {
    const model = new ChatAgentCC({ agentccApiKey: "sk-test" });
    expect(model.modelName).toBe("gpt-4o");
    expect(model.client).toBeDefined();
  });

  it("creates instance with custom model", () => {
    const model = new ChatAgentCC({ model: "gpt-3.5-turbo" });
    expect(model.modelName).toBe("gpt-3.5-turbo");
  });

  it("has LangChain serialization metadata", () => {
    const model = new ChatAgentCC();
    expect(ChatAgentCC.lc_name()).toBe("ChatAgentCC");
    expect(model.lc_namespace).toEqual(["futureagi", "agentcc", "chat_models"]);
  });

  it("generate() converts messages and returns ChatResult", async () => {
    const mockFetch = mockFetchResponse("Hello from AgentCC!");
    const model = new ChatAgentCC({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await model.generate([
      makeSystemMessage("You are helpful."),
      makeHumanMessage("Hi!"),
    ]);

    expect(result.generations).toHaveLength(1);
    expect(result.generations[0].text).toBe("Hello from AgentCC!");
    expect(result.generations[0].message._getType()).toBe("ai");
    expect(result.generations[0].message.content).toBe("Hello from AgentCC!");
    expect(result.generations[0].generationInfo?.finish_reason).toBe("stop");
    expect(result.llmOutput?.modelName).toBe("gpt-4o");

    // Verify fetch was called with correct body
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].role).toBe("user");
  });

  it("generate() passes temperature and maxTokens", async () => {
    const mockFetch = mockFetchResponse("ok");
    const model = new ChatAgentCC({
      agentccApiKey: "sk-test",
      temperature: 0.7,
      maxTokens: 100,
      topP: 0.9,
      clientOptions: { fetch: mockFetch },
    });

    await model.generate([makeHumanMessage("test")]);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(100);
    expect(body.top_p).toBe(0.9);
  });

  it("generate() passes stop sequences", async () => {
    const mockFetch = mockFetchResponse("ok");
    const model = new ChatAgentCC({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    await model.generate([makeHumanMessage("test")], {
      stop: ["\n", "STOP"],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.stop).toEqual(["\n", "STOP"]);
  });

  it("invoke() returns AI message directly", async () => {
    const mockFetch = mockFetchResponse("Invoked response");
    const model = new ChatAgentCC({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const message = await model.invoke([makeHumanMessage("Hello")]);
    expect(message._getType()).toBe("ai");
    expect(message.content).toBe("Invoked response");
  });

  it("handles empty response content", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "chatcmpl-1",
          choices: [{ index: 0, message: { role: "assistant", content: null }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const model = new ChatAgentCC({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await model.generate([makeHumanMessage("test")]);
    expect(result.generations[0].text).toBe("");
  });
});
