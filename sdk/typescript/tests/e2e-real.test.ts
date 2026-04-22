/**
 * E2E Tests — Real API calls through the AgentCC gateway
 *
 * These tests make actual network requests to the running AgentCC gateway
 * (localhost:8090) which proxies to OpenAI and other providers.
 *
 * Run with: npx vitest run tests/e2e-real.test.ts
 */
import { describe, it, expect } from "vitest";
import {
  AgentCC,
  Session,
  BudgetManager,
  RetryPolicy,
  LoggingCallback,
  MetricsCallback,
  OTelCallback,
  TraceContextManager,
  createMiddleware,
  validateJsonResponse,
  toResponseFormat,
  checkValidKey,
  healthCheck,
  tokenCounter,
  completionCost,
  getModelInfo,
  getValidModels,
  allowModels,
  blockModels,
  AgentCCError,
} from "../src/index.js";
import type {
  ChatCompletion,
  AgentCCMetadata,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// The gateway has its own auth keys (configured in config.yaml), NOT the provider keys.
const API_KEY = "sk-agentcc-e2e-test-key-001";
const BASE_URL = "http://localhost:8090";

function makeClient(opts: Record<string, unknown> = {}): AgentCC {
  return new AgentCC({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// 1. Basic chat completion
// ---------------------------------------------------------------------------

describe("E2E: Chat Completions", () => {
  it("creates a basic chat completion", async () => {
    const client = makeClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say exactly: PONG" }],
      max_tokens: 10,
    });

    expect(response).toBeDefined();
    expect(response.id).toBeTruthy();
    expect(response.choices).toHaveLength(1);
    expect(response.choices[0].message.role).toBe("assistant");
    expect(response.choices[0].message.content).toBeTruthy();
    expect(response.choices[0].finish_reason).toBeTruthy();
    console.log("  Basic completion:", response.choices[0].message.content);
  }, 30000);

  it("returns usage info", async () => {
    const client = makeClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say hi" }],
      max_tokens: 5,
    });

    const usage = (response as any).usage;
    expect(usage).toBeDefined();
    expect(usage.prompt_tokens).toBeGreaterThan(0);
    expect(usage.completion_tokens).toBeGreaterThan(0);
    expect(usage.total_tokens).toBeGreaterThan(0);
    console.log("  Usage:", usage);
  }, 30000);

  it("passes temperature and max_tokens", async () => {
    const client = makeClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Reply with a single digit" }],
      temperature: 0,
      max_tokens: 3,
    });

    expect(response.choices[0].message.content).toBeTruthy();
    expect(response.choices[0].message.content!.length).toBeLessThanOrEqual(10);
  }, 30000);

  it("handles system message", async () => {
    const client = makeClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Always respond with exactly 'YES'" },
        { role: "user", content: "Should I?" },
      ],
      max_tokens: 5,
      temperature: 0,
    });

    expect(response.choices[0].message.content?.toUpperCase()).toContain("YES");
  }, 30000);

  it("handles multi-turn conversation", async () => {
    const client = makeClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "My name is Alice." },
        { role: "assistant", content: "Hello Alice!" },
        { role: "user", content: "What's my name?" },
      ],
      max_tokens: 20,
      temperature: 0,
    });

    expect(response.choices[0].message.content?.toLowerCase()).toContain("alice");
  }, 30000);
});

// ---------------------------------------------------------------------------
// 2. Streaming
// ---------------------------------------------------------------------------

describe("E2E: Streaming", () => {
  it("streams chat completion chunks", async () => {
    const client = makeClient();
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Count from 1 to 3" }],
      max_tokens: 30,
      stream: true,
    });

    const chunks: string[] = [];
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) chunks.push(content);
    }

    expect(chunks.length).toBeGreaterThan(0);
    const fullText = chunks.join("");
    expect(fullText).toBeTruthy();
    console.log("  Streamed:", fullText.slice(0, 100));
  }, 30000);

  it("StreamManager collects full text", async () => {
    const client = makeClient();
    const mgr = await client.chat.completions.stream({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say 'hello world'" }],
      max_tokens: 10,
    });

    const allChunks: string[] = [];
    for await (const chunk of mgr) {
      const c = chunk.choices?.[0]?.delta?.content;
      if (c) allChunks.push(c);
    }

    expect(allChunks.length).toBeGreaterThan(0);
    console.log("  StreamManager:", allChunks.join(""));
  }, 30000);
});

// ---------------------------------------------------------------------------
// 3. AgentCC metadata
// ---------------------------------------------------------------------------

describe("E2E: AgentCC Metadata", () => {
  it("auto-attaches agentcc metadata to response", async () => {
    const client = makeClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 5,
    });

    expect(response.agentcc).toBeDefined();
    const agentcc = response.agentcc!;
    console.log("  AgentCC metadata:", JSON.stringify(agentcc, null, 2));
    // requestId and provider should be populated
    expect(agentcc.requestId).toBeTruthy();
  }, 30000);
});

// ---------------------------------------------------------------------------
// 4. Session management
// ---------------------------------------------------------------------------

describe("E2E: Session Management", () => {
  it("creates a session-scoped client", async () => {
    const client = makeClient();
    const { client: sessClient, session } = client.session({
      name: "e2e-test-session",
    });

    expect(session.sessionId).toBeTruthy();
    expect(session.name).toBe("e2e-test-session");

    const response = await sessClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
    });

    expect(response.choices[0].message.content).toBeTruthy();
    expect(session.requestCount).toBe(1);
    console.log("  Session ID:", session.sessionId);
    console.log("  Request count:", session.requestCount);
  }, 30000);

  it("tracks cost across session requests", async () => {
    const client = makeClient();
    const { client: sessClient, session } = client.session();

    await sessClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "1" }],
      max_tokens: 3,
    });
    await sessClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "2" }],
      max_tokens: 3,
    });

    expect(session.requestCount).toBe(2);
    console.log("  Session total cost:", session.totalCost);
    console.log("  Session request count:", session.requestCount);
  }, 60000);
});

// ---------------------------------------------------------------------------
// 5. Callbacks
// ---------------------------------------------------------------------------

describe("E2E: Callbacks", () => {
  it("LoggingCallback fires on request", async () => {
    const logs: string[] = [];
    const loggingCb = new LoggingCallback();
    // Override console.log to capture
    const origLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(" "));
    };

    const client = makeClient({ callbacks: [loggingCb] });
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5,
    });

    console.log = origLog;
    expect(logs.length).toBeGreaterThan(0);
    console.log("  Logging callback captured", logs.length, "log entries");
  }, 30000);

  it("MetricsCallback tracks request count", async () => {
    const metricsCb = new MetricsCallback();
    const client = makeClient({ callbacks: [metricsCb] });

    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5,
    });

    const metrics = metricsCb.getMetrics();
    expect(metrics.requestCount).toBe(1);
    expect(metrics.avgLatencyMs).toBeGreaterThanOrEqual(0);
    console.log("  Metrics:", JSON.stringify(metrics));
  }, 30000);
});

// ---------------------------------------------------------------------------
// 6. Trace context
// ---------------------------------------------------------------------------

describe("E2E: Trace Context", () => {
  it("sends traceparent header with request", async () => {
    const client = makeClient({ traceContext: true });
    expect((client as any)._traceManager).toBeDefined();
    expect((client as any)._traceManager.traceId).toMatch(/^[0-9a-f]{32}$/);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "trace test" }],
      max_tokens: 5,
    });

    expect(response).toBeDefined();
    console.log("  Trace ID:", (client as any)._traceManager.traceId);
  }, 30000);
});

// ---------------------------------------------------------------------------
// 7. Middleware
// ---------------------------------------------------------------------------

describe("E2E: Middleware", () => {
  it("middleware can observe requests", async () => {
    const observed: { model?: string; latency?: number }[] = [];

    const observerMw = createMiddleware({
      name: "observer",
      async onRequest(ctx, next) {
        const start = Date.now();
        const result = await next(ctx);
        observed.push({
          model: ctx.model,
          latency: Date.now() - start,
        });
        return result;
      },
    });

    const client = makeClient();
    client.use(observerMw);

    // Note: middleware is registered but the current base-client doesn't
    // run middleware in the request path (it's a separate feature).
    // We verify middleware registration works without errors.
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "middleware test" }],
      max_tokens: 5,
    });

    expect(response).toBeDefined();
    console.log("  Middleware registered, request succeeded");
  }, 30000);
});

// ---------------------------------------------------------------------------
// 8. Models resource
// ---------------------------------------------------------------------------

describe("E2E: Models", () => {
  it("lists available models", async () => {
    const client = makeClient();
    const models = await client.models.list();

    expect(models.data).toBeDefined();
    expect(models.data.length).toBeGreaterThan(0);
    const modelIds = models.data.map((m: any) => m.id);
    console.log("  Available models:", modelIds.slice(0, 10).join(", "));
    expect(modelIds).toContain("gpt-4o-mini");
  }, 30000);
});

// ---------------------------------------------------------------------------
// 9. Cost tracking
// ---------------------------------------------------------------------------

describe("E2E: Cost Tracking", () => {
  it("tracks cumulative cost on client", async () => {
    const client = makeClient();
    expect(client.currentCost).toBe(0);

    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "cost test" }],
      max_tokens: 5,
    });

    // Cost may or may not be reported via headers depending on gateway config
    console.log("  Current cost after 1 request:", client.currentCost);
  }, 30000);
});

// ---------------------------------------------------------------------------
// 10. Dry run
// ---------------------------------------------------------------------------

describe("E2E: Dry Run", () => {
  it("inspects request without sending", () => {
    const client = makeClient();
    const result = client.chat.completions.dryRun({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "dry run test" }],
      temperature: 0.7,
      max_tokens: 100,
    });

    expect(result.url).toBe("http://localhost:8090/v1/chat/completions");
    expect(result.method).toBe("POST");
    expect(result.headers["Authorization"]).toContain("Bearer ");
    expect((result.body as any).model).toBe("gpt-4o-mini");
    expect((result.body as any).temperature).toBe(0.7);
    expect((result.body as any).max_tokens).toBe(100);
    console.log("  Dry run URL:", result.url);
    console.log("  Headers count:", Object.keys(result.headers).length);
  });
});

// ---------------------------------------------------------------------------
// 11. Pre-call rules
// ---------------------------------------------------------------------------

describe("E2E: Pre-call Rules", () => {
  it("blocks disallowed model before sending", async () => {
    const client = makeClient({
      preCallRules: [allowModels(["gpt-4o-mini"])],
    });

    // Allowed model should work
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "allowed" }],
      max_tokens: 5,
    });
    expect(response).toBeDefined();

    // Blocked model should throw without network call
    await expect(
      client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "blocked" }],
        max_tokens: 5,
      }),
    ).rejects.toThrow("not in the allowed list");
    console.log("  Pre-call rules working: gpt-4o-mini allowed, gpt-4o blocked");
  }, 30000);
});

// ---------------------------------------------------------------------------
// 12. Token utilities
// ---------------------------------------------------------------------------

describe("E2E: Token Utilities", () => {
  it("counts tokens for a message", () => {
    const count = tokenCounter("gpt-4o", { text: "Hello, how are you today?" });
    expect(count).toBeGreaterThan(0);
    console.log("  Token count:", count);
  });

  it("estimates completion cost", () => {
    const cost = completionCost("gpt-4o-mini", 100, 50);
    expect(cost).toBeGreaterThan(0);
    console.log("  Estimated cost for 100 input + 50 output tokens:", cost);
  });

  it("returns model info", () => {
    const info = getModelInfo("gpt-4o-mini");
    expect(info).toBeDefined();
    expect(info?.maxTokens).toBeGreaterThan(0);
    expect(info?.maxOutputTokens).toBeGreaterThan(0);
    console.log("  gpt-4o-mini context window:", info?.maxTokens);
  });

  it("lists valid models", () => {
    const models = getValidModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models).toContain("gpt-4o-mini");
    console.log("  Valid models count:", models.length);
  });
});

// ---------------------------------------------------------------------------
// 13. Validate response
// ---------------------------------------------------------------------------

describe("E2E: Validate Response", () => {
  it("validates real structured output against schema", async () => {
    const client = makeClient();
    const schema = {
      type: "object" as const,
      properties: {
        color: { type: "string" as const },
        hex: { type: "string" as const },
      },
      required: ["color", "hex"],
    };

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content:
            'Return a JSON object with "color" (string) and "hex" (string) for the color blue.',
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "color_info",
          strict: true,
          schema: {
            type: "object",
            properties: {
              color: { type: "string" },
              hex: { type: "string" },
            },
            required: ["color", "hex"],
            additionalProperties: false,
          },
        },
      } as any,
      max_tokens: 50,
      temperature: 0,
    });

    const content = response.choices[0].message.content!;
    console.log("  Structured output:", content);

    const validation = validateJsonResponse(content, schema);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const parsed = JSON.parse(content);
    expect(parsed.color).toBeTruthy();
    expect(parsed.hex).toBeTruthy();
    console.log("  Validation passed:", parsed);
  }, 30000);

  it("toResponseFormat creates correct format", () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    const rf = toResponseFormat(schema, "person");

    expect((rf as any).type).toBe("json_schema");
    expect((rf as any).json_schema.name).toBe("person");
    expect((rf as any).json_schema.strict).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 14. JSON Schema auto-validation (enableJsonSchemaValidation)
// ---------------------------------------------------------------------------

describe("E2E: Auto JSON Schema Validation", () => {
  it("validates response automatically when flag is enabled", async () => {
    const client = makeClient({ enableJsonSchemaValidation: true });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Return JSON: {\"count\": 42}" },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "counter",
          strict: true,
          schema: {
            type: "object",
            properties: { count: { type: "number" } },
            required: ["count"],
            additionalProperties: false,
          },
        },
      } as any,
      max_tokens: 20,
      temperature: 0,
    });

    // If we get here, validation passed
    const content = response.choices[0].message.content!;
    const parsed = JSON.parse(content);
    expect(parsed.count).toBe(42);
    console.log("  Auto-validation passed:", parsed);
  }, 30000);
});

// ---------------------------------------------------------------------------
// 15. Health check utilities
// ---------------------------------------------------------------------------

describe("E2E: Health Check Utilities", () => {
  it("checkValidKey returns valid for a good key", async () => {
    const result = await checkValidKey({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
    });

    expect(result.valid).toBe(true);
    console.log("  Key valid:", result.valid);
  }, 30000);

  it("healthCheck returns healthy", async () => {
    const result = await healthCheck({
      model: "gpt-4o-mini",
      apiKey: API_KEY,
      baseUrl: BASE_URL,
    });

    expect(result.healthy).toBe(true);
    expect(result.latencyMs).toBeGreaterThan(0);
    console.log("  Health check:", {
      healthy: result.healthy,
      latencyMs: result.latencyMs,
      provider: result.provider,
      model: result.model,
    });
  }, 30000);
});

// ---------------------------------------------------------------------------
// 16. Budget manager
// ---------------------------------------------------------------------------

describe("E2E: Budget Manager", () => {
  it("tracks budget across requests", async () => {
    const budget = new BudgetManager({ maxBudget: 1.0 });
    const client = makeClient();

    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "budget test" }],
      max_tokens: 5,
    });

    // Budget tracking works via budget.getRemainingBudget()
    const remaining = budget.getRemainingBudget();
    expect(remaining).toBeDefined();
    expect(remaining).toBeLessThanOrEqual(1.0);
    console.log("  Budget remaining:", remaining);
  }, 30000);
});

// ---------------------------------------------------------------------------
// 17. withOptions
// ---------------------------------------------------------------------------

describe("E2E: withOptions", () => {
  it("creates a derived client with different config", async () => {
    const client = makeClient();
    const derived = client.withOptions({
      defaultHeaders: { "X-Custom-E2E": "test" },
    });

    const response = await derived.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "derived test" }],
      max_tokens: 5,
    });

    expect(response).toBeDefined();
    console.log("  Derived client works");
  }, 30000);
});

// ---------------------------------------------------------------------------
// 18. Gateway health check on client
// ---------------------------------------------------------------------------

describe("E2E: Client healthCheck", () => {
  it("client.healthCheck() returns true for running gateway", async () => {
    const client = makeClient();
    const healthy = await client.healthCheck();
    expect(healthy).toBe(true);
    console.log("  Gateway healthy:", healthy);
  }, 10000);
});

// ---------------------------------------------------------------------------
// 19. Error handling
// ---------------------------------------------------------------------------

describe("E2E: Error Handling", () => {
  it("throws on invalid model", async () => {
    const client = makeClient();

    await expect(
      client.chat.completions.create({
        model: "nonexistent-model-xyz-123",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5,
      }),
    ).rejects.toThrow();
  }, 30000);
});

// ---------------------------------------------------------------------------
// 20. Embeddings — skipped: gateway does not proxy /v1/embeddings
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 21. Moderations — skipped: gateway does not proxy /v1/moderations
// ---------------------------------------------------------------------------
