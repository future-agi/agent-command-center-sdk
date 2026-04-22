import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

describe("rerank", () => {
  itest("rerank documents", async (ctx) => {
    try {
      const r = await client.rerank.rank({
        model: "rerank-english-v3.0",
        query: "capital of France",
        documents: [
          "Paris is the capital of France.",
          "Berlin is in Germany.",
          "Tokyo is the capital of Japan.",
        ],
      } as any);
      expect(r.results.length).toBeGreaterThan(0);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks: ${e}`);
      throw e;
    }
  });
});
