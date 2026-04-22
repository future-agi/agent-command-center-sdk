import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// vi.mock is hoisted — use vi.hoisted to declare the mock fn before hoisting
const { mockCreateOpenAI } = vi.hoisted(() => {
  const mockCreateOpenAI = vi.fn(() => {
    const provider = (modelId: string) => ({ modelId, provider: "agentcc" });
    provider.chat = (modelId: string) => ({ modelId, type: "chat" });
    provider.completion = (modelId: string) => ({
      modelId,
      type: "completion",
    });
    provider.embedding = (modelId: string) => ({
      modelId,
      type: "embedding",
    });
    return provider;
  });
  return { mockCreateOpenAI };
});

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: mockCreateOpenAI,
}));

import { createAgentCC } from "../src/agentcc-provider.js";

describe("createAgentCC", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockCreateOpenAI.mockClear();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("passes apiKey and baseURL to createOpenAI", () => {
    createAgentCC({
      apiKey: "sk-test-123",
      baseURL: "https://my-gateway.example.com/v1",
    });

    expect(mockCreateOpenAI).toHaveBeenCalledOnce();
    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.apiKey).toBe("sk-test-123");
    expect(opts.baseURL).toBe("https://my-gateway.example.com/v1");
    expect(opts.compatibility).toBe("compatible");
  });

  it("reads AGENTCC_API_KEY and AGENTCC_GATEWAY_URL from env", () => {
    process.env.AGENTCC_API_KEY = "sk-env-key";
    process.env.AGENTCC_GATEWAY_URL = "https://env-gateway.com/v1";

    createAgentCC();

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.apiKey).toBe("sk-env-key");
    expect(opts.baseURL).toBe("https://env-gateway.com/v1");
  });

  it("falls back to AGENTCC_BASE_URL if AGENTCC_GATEWAY_URL not set", () => {
    process.env.AGENTCC_API_KEY = "sk-key";
    process.env.AGENTCC_BASE_URL = "https://base-url.com/v1";
    delete process.env.AGENTCC_GATEWAY_URL;

    createAgentCC();

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.baseURL).toBe("https://base-url.com/v1");
  });

  it("defaults to https://api.agentcc.ai/v1 when no URL provided", () => {
    delete process.env.AGENTCC_GATEWAY_URL;
    delete process.env.AGENTCC_BASE_URL;

    createAgentCC({ apiKey: "sk-key" });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.baseURL).toBe("https://api.agentcc.ai/v1");
  });

  it("serializes config as x-agentcc-config header", () => {
    const config = {
      strategy: "fallback",
      targets: [{ provider: "openai" }, { provider: "anthropic" }],
    };

    createAgentCC({ apiKey: "sk-key", config });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.headers["x-agentcc-config"]).toBe(JSON.stringify(config));
  });

  it("sets traceId, sessionId, userId, and metadata headers", () => {
    createAgentCC({
      apiKey: "sk-key",
      traceId: "trace-abc",
      sessionId: "sess-xyz",
      userId: "user-42",
      metadata: { env: "production" },
    });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.headers["x-agentcc-trace-id"]).toBe("trace-abc");
    expect(opts.headers["x-agentcc-session-id"]).toBe("sess-xyz");
    expect(opts.headers["x-agentcc-user-id"]).toBe("user-42");
    expect(opts.headers["x-agentcc-metadata"]).toBe(
      JSON.stringify({ env: "production" }),
    );
  });

  it("sets cache headers when cacheEnabled is true", () => {
    createAgentCC({
      apiKey: "sk-key",
      cacheEnabled: true,
      cacheTtl: "10m",
    });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.headers["x-agentcc-cache"]).toBe("true");
    expect(opts.headers["x-agentcc-cache-ttl"]).toBe("10m");
  });

  it("does not set cache headers when cacheEnabled is false/undefined", () => {
    createAgentCC({ apiKey: "sk-key" });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.headers["x-agentcc-cache"]).toBeUndefined();
  });

  it("sets guardrail policy header", () => {
    createAgentCC({
      apiKey: "sk-key",
      guardrailPolicy: "pii-block",
    });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.headers["x-agentcc-guardrail-policy"]).toBe("pii-block");
  });

  it("sets custom property headers with x-agentcc-property- prefix", () => {
    createAgentCC({
      apiKey: "sk-key",
      properties: { environment: "staging", team: "ml" },
    });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.headers["x-agentcc-property-environment"]).toBe("staging");
    expect(opts.headers["x-agentcc-property-team"]).toBe("ml");
  });

  it("merges user headers after AgentCC headers (user wins)", () => {
    createAgentCC({
      apiKey: "sk-key",
      traceId: "auto-trace",
      headers: {
        "x-agentcc-trace-id": "manual-trace",
        "x-custom": "value",
      },
    });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    // User-provided header overrides AgentCC-generated one
    expect(opts.headers["x-agentcc-trace-id"]).toBe("manual-trace");
    expect(opts.headers["x-custom"]).toBe("value");
  });

  it("returns a callable provider", () => {
    const agentcc = createAgentCC({ apiKey: "sk-key" });

    // The mock returns a callable function
    expect(typeof agentcc).toBe("function");
    const model = agentcc("gpt-4o") as any;
    expect(model.modelId).toBe("gpt-4o");
  });

  it("explicit settings override env vars", () => {
    process.env.AGENTCC_API_KEY = "sk-env";
    process.env.AGENTCC_GATEWAY_URL = "https://env.com/v1";

    createAgentCC({
      apiKey: "sk-explicit",
      baseURL: "https://explicit.com/v1",
    });

    const opts = mockCreateOpenAI.mock.calls[0][0];
    expect(opts.apiKey).toBe("sk-explicit");
    expect(opts.baseURL).toBe("https://explicit.com/v1");
  });
});
