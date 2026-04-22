import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

const MODEL = "gemini-2.0-flash";

describe("chat.completions extras", () => {
  itest("stream() returns a StreamManager with collected text", async () => {
    const mgr = await client.chat.completions.stream({
      model: MODEL,
      messages: [{ role: "user", content: "Say hi." }],
      max_tokens: 10,
    });
    let text = "";
    for await (const chunk of mgr as any) {
      text += chunk.choices?.[0]?.delta?.content ?? "";
    }
    expect(text.length).toBeGreaterThan(0);
  });

  itest("runTools executes local tool then produces final answer", async (ctx) => {
    try {
      const result = await client.chat.completions.runTools({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "What's the weather in Paris? Use the tool." }],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get the weather for a city.",
              parameters: {
                type: "object",
                properties: { city: { type: "string" } },
                required: ["city"],
              },
              execute: async (args: any) => ({ city: args.city, temp_f: 70 }),
            },
          },
        ],
        maxSteps: 3,
      } as any);
      expect(result).toBeDefined();
      expect((result as any).completion).toBeDefined();
      expect(Array.isArray((result as any).steps)).toBe(true);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway gap on runTools path: ${e}`);
      throw e;
    }
  });

  itest("streaming + tools combo", async (ctx) => {
    try {
      const stream = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "What's weather in Tokyo? Use get_weather." }],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get the weather for a city.",
              parameters: {
                type: "object",
                properties: { city: { type: "string" } },
                required: ["city"],
              },
            },
          },
        ],
        stream: true,
        max_tokens: 100,
      });
      let sawToolCall = false;
      let chunks = 0;
      for await (const chunk of stream as any) {
        chunks++;
        if (chunk.choices?.[0]?.delta?.tool_calls) sawToolCall = true;
      }
      expect(chunks).toBeGreaterThan(0);
      expect(sawToolCall).toBe(true);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway gap on streaming tools: ${e}`);
      throw e;
    }
  });

  itest("dryRun returns request inspection without network", () => {
    const out = client.chat.completions.dryRun({
      model: MODEL,
      messages: [{ role: "user", content: "hello there" }],
      max_tokens: 10,
    });
    expect(out).toBeDefined();
    expect(out.url).toContain("/v1/chat/completions");
    expect(out.method).toBe("POST");
    expect(out.headers).toBeDefined();
    expect(out.body).toBeDefined();
  });
});
