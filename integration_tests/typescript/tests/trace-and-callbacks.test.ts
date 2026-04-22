import { describe, expect } from "vitest";
import { client, itest } from "./_helpers.js";

describe("trace context + callbacks", () => {
  itest("client with traceContext=true attaches a traceparent", async () => {
    const { AgentCC } = await import("@agentcc/client");
    const scoped = new AgentCC({
      apiKey: process.env.AGENTCC_API_KEY!,
      baseUrl: process.env.AGENTCC_BASE_URL!,
      traceContext: true,
    });
    const r = await scoped.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "ok" }],
      max_tokens: 3,
    });
    expect(r.agentcc?.requestId).toBeTruthy();
  });

  itest("CallbackHandler fires onRequestStart + onRequestEnd", async () => {
    const { AgentCC, CallbackHandler } = await import("@agentcc/client");
    const events: string[] = [];
    class T extends CallbackHandler {
      onRequestStart() {
        events.push("start");
      }
      onRequestEnd() {
        events.push("end");
      }
    }
    const scoped = new AgentCC({
      apiKey: process.env.AGENTCC_API_KEY!,
      baseUrl: process.env.AGENTCC_BASE_URL!,
      callbacks: [new T()],
    });
    const r = await scoped.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "ok" }],
      max_tokens: 3,
    });
    expect(r.agentcc?.requestId).toBeTruthy();
    expect(events).toContain("start");
    expect(events).toContain("end");
  });

  itest("Session class tracks request count + path", async () => {
    const { Session } = await import("@agentcc/client");
    const s = new Session({ sessionId: "itest-session-1", name: "t" });
    s.step("search");
    s.step("summarize");
    expect(s.path).toBe("/search/summarize");
    s.trackRequest(0.01, 42);
    expect(s.requestCount).toBe(1);
    expect(s.totalTokens).toBe(42);
    s.resetPath();
    expect(s.path).toBe("/");
  });
});
