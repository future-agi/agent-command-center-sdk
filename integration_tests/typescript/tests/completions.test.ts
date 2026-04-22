import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

describe("completions (legacy text)", () => {
  itest("create legacy completion", async (ctx) => {
    try {
      const r = await client.completions.create({
        model: "gpt-4o-mini",
        prompt: "Reply with only the word: pong",
        max_tokens: 5,
      } as any);
      expect(r).toBeDefined();
      expect((r as any).choices?.[0]).toBeDefined();
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks legacy completions: ${e}`);
      throw e;
    }
  });
});
