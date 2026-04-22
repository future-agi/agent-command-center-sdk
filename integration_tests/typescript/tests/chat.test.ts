import { describe, expect } from "vitest";
import { client, itest } from "./_helpers.js";

const MODEL = "gemini-2.0-flash";

describe("chat.completions", () => {
  itest("sync completion", async () => {
    const r = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "Reply with only: hi" }],
      max_tokens: 5,
    });
    expect(r.choices[0].message.content).toBeTruthy();
    expect(r.agentcc?.requestId).toBeTruthy();
  });

  itest("streaming completion", async () => {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "Count to 3." }],
      stream: true,
      max_tokens: 20,
    });
    let text = "";
    let count = 0;
    for await (const chunk of stream as any) {
      count++;
      text += chunk.choices?.[0]?.delta?.content ?? "";
    }
    expect(count).toBeGreaterThan(0);
    expect(text.length).toBeGreaterThan(0);
  });

  itest("tool calling", async () => {
    const r = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "What's the weather in Bangalore?" }],
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get the current weather in a given city.",
            parameters: {
              type: "object",
              properties: { city: { type: "string" } },
              required: ["city"],
            },
          },
        },
      ],
      max_tokens: 100,
    });
    const calls = r.choices[0].message.tool_calls;
    expect(calls).toBeDefined();
    expect(calls!.length).toBeGreaterThan(0);
    expect(calls![0].function.name).toBe("get_weather");
  });

  itest("structured output (json_object)", async () => {
    const r = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "user", content: "Alice is 30. Respond as JSON: {name, age}." },
      ],
      response_format: { type: "json_object" },
      max_tokens: 50,
    });
    expect(r.choices[0].message.content).toContain("Alice");
  });
});
