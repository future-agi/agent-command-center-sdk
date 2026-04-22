import { describe, it, expect, vi } from "vitest";
import { AgentCCCallbackHandler } from "../src/callback-handler.js";

describe("AgentCCCallbackHandler", () => {
  it("forwards handleLLMStart to onRequestStart", async () => {
    const onRequestStart = vi.fn();
    const handler = new AgentCCCallbackHandler({
      callbacks: [{ onRequestStart } as any],
    });

    await handler.handleLLMStart(
      { type: "llm", id: ["langchain", "chat_models", "ChatOpenAI"] },
      ["Hello"],
      "run-123",
      undefined,
      { model: "gpt-4o" },
    );

    expect(onRequestStart).toHaveBeenCalledTimes(1);
    const cbReq = onRequestStart.mock.calls[0][0];
    expect(cbReq.body.model).toBe("gpt-4o");
    expect(cbReq.body.prompts).toEqual(["Hello"]);
  });

  it("forwards handleLLMEnd to onRequestEnd", async () => {
    const onRequestEnd = vi.fn();
    const handler = new AgentCCCallbackHandler({
      callbacks: [{ onRequestEnd } as any],
    });

    // Start first (to record timing)
    await handler.handleLLMStart(
      { type: "llm", id: ["langchain"] },
      ["test"],
      "run-456",
      undefined,
      { model: "gpt-4o" },
    );

    await handler.handleLLMEnd(
      {
        generations: [[{ text: "response" }]],
        llmOutput: {
          tokenUsage: {
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
          },
        },
      },
      "run-456",
    );

    expect(onRequestEnd).toHaveBeenCalledTimes(1);
    const [, cbResp] = onRequestEnd.mock.calls[0];
    expect(cbResp.statusCode).toBe(200);
    expect(cbResp.agentcc.provider).toBe("langchain");
    expect(cbResp.agentcc.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("forwards handleLLMError to onError", async () => {
    const onError = vi.fn();
    const handler = new AgentCCCallbackHandler({
      callbacks: [{ onError } as any],
    });

    await handler.handleLLMStart(
      { type: "llm", id: ["langchain"] },
      ["test"],
      "run-789",
    );

    const error = new Error("API failure");
    await handler.handleLLMError(error, "run-789");

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][1]).toBe(error);
  });

  it("does not throw when callback throws", async () => {
    const handler = new AgentCCCallbackHandler({
      callbacks: [
        {
          onRequestStart: () => {
            throw new Error("boom");
          },
        } as any,
      ],
    });

    // Should not throw
    await handler.handleLLMStart(
      { type: "llm", id: ["langchain"] },
      ["test"],
      "run-safe",
    );
  });
});
