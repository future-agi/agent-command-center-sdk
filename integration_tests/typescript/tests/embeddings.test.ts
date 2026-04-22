import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

describe("embeddings", () => {
  itest("single embedding", async (ctx) => {
    try {
      const r = await client.embeddings.create({
        model: "gemini-embedding-001",
        input: "hello world",
      });
      expect(r.data).toHaveLength(1);
      expect(r.data[0].embedding.length).toBeGreaterThan(0);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks: ${e}`);
      throw e;
    }
  });

  itest("batch embeddings", async (ctx) => {
    try {
      const r = await client.embeddings.create({
        model: "gemini-embedding-001",
        input: ["foo", "bar", "baz"],
      });
      expect(r.data).toHaveLength(3);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks: ${e}`);
      throw e;
    }
  });
});
