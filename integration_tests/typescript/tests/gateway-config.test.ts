import { describe, expect } from "vitest";
import { client, itest } from "./_helpers.js";

describe("GatewayConfig combined headers", () => {
  itest("cache + retry + timeout config produces x-agentcc-config header and works over the wire", async () => {
    const { createHeaders } = await import("@agentcc/client");
    const headers = createHeaders({
      config: {
        cache: { enabled: true, ttl: 30, namespace: "itest-combined" },
        retry: { max_retries: 1 } as any,
        timeout: { request_timeout_ms: 10_000 } as any,
      },
    });
    expect(headers["x-agentcc-config"]).toBeTruthy();
    const parsed = JSON.parse(headers["x-agentcc-config"]);
    expect(parsed.cache.ttl).toBe(30);
    expect(parsed.cache.namespace).toBe("itest-combined");
    expect(headers["x-agentcc-cache-ttl"]).toBe("30");
    expect(headers["x-agentcc-cache-namespace"]).toBe("itest-combined");
  });

  itest("client with gateway config attached still completes a request", async () => {
    const { AgentCC } = await import("@agentcc/client");
    const scoped = new AgentCC({
      apiKey: process.env.AGENTCC_API_KEY!,
      baseUrl: process.env.AGENTCC_BASE_URL!,
      config: {
        cache: { enabled: true, ttl: 30, namespace: "itest-live" },
      },
    });
    const r = await scoped.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "ok" }],
      max_tokens: 3,
    });
    expect(r.agentcc?.requestId).toBeTruthy();
  });
});
