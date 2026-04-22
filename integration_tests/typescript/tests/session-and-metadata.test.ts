import { describe, expect } from "vitest";
import { client, itest, uniqName } from "./_helpers.js";

describe("session + metadata", () => {
  itest("client-level metadata is attached to requests", async () => {
    const scoped = (client as any).withOptions
      ? (client as any).withOptions({ metadata: { itest: uniqName() } })
      : client;
    const r = await scoped.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "ok" }],
      max_tokens: 3,
    });
    expect(r.agentcc?.requestId).toBeTruthy();
  });

  itest("session context produces x-agentcc-* headers via createHeaders", async () => {
    const { createHeaders } = await import("@agentcc/client");
    const h = createHeaders({
      sessionId: "itest-sess",
      sessionName: "wire-test",
      sessionPath: "/search/summarize",
      metadata: { k: "v" },
    });
    expect(h["x-agentcc-session-id"]).toBe("itest-sess");
    expect(h["x-agentcc-session-name"]).toBe("wire-test");
    expect(h["x-agentcc-session-path"]).toBe("/search/summarize");
    expect(h["x-agentcc-metadata"]).toBeTruthy();
  });
});
