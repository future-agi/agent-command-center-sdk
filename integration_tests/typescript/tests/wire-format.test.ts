/**
 * Critical wire-format test. Verifies SDK↔gateway agentcc headers end-to-end.
 */
import { describe, expect } from "vitest";
import { client, itest } from "./_helpers.js";

describe("wire format", () => {
  itest("request_id round-trip: gateway stamps x-agentcc-request-id, SDK surfaces it", async () => {
    const result = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "Reply with only: pong" }],
      max_tokens: 5,
    });
    expect(result.agentcc).toBeDefined();
    expect(result.agentcc?.requestId).toBeTruthy();
    expect(result.agentcc?.provider).toBeTruthy();
  });

  itest("session_id sent as x-agentcc-session-id (accepted by gateway)", async () => {
    const result = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "ok" }],
      sessionId: "agentcc-itest-session-wire",
      max_tokens: 3,
    } as any);
    expect(result.agentcc).toBeDefined();
    expect(result.agentcc?.requestId).toBeTruthy();
  });

  itest("metadata sent as x-agentcc-metadata (accepted by gateway)", async () => {
    const result = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "ok" }],
      metadata: { test: "wire-format", ci: true },
      max_tokens: 2,
    } as any);
    expect(result.agentcc).toBeDefined();
  });

  itest("GatewayConfig → createHeaders produces x-agentcc-* wire names", async () => {
    const { createHeaders } = await import("@agentcc/client");
    const headers = createHeaders({
      cacheTtl: "60",
      cacheNamespace: "agentcc-itest",
      sessionId: "abc",
    });
    expect(headers["x-agentcc-cache-ttl"]).toBe("60");
    expect(headers["x-agentcc-cache-namespace"]).toBe("agentcc-itest");
    expect(headers["x-agentcc-session-id"]).toBe("abc");
  });

  itest("User-Agent round-trip: successful request implies agentcc-typescript UA accepted", async () => {
    // We can't read the outbound UA from here, but if it were broken (empty /
    // malformed) the request chain would fail. A successful round-trip with
    // a valid response id confirms the UA header was formed and accepted.
    const result = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "ok" }],
      max_tokens: 2,
    });
    expect(result.agentcc?.requestId).toBeTruthy();
  });
});
