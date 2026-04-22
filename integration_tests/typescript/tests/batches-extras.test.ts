import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

describe("batches.list", () => {
  itest("list batches returns a list shape", async (ctx) => {
    try {
      const r = await client.batches.list({ limit: 5 });
      expect(r).toBeDefined();
      expect(Array.isArray((r as any).data)).toBe(true);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks batches.list: ${e}`);
      throw e;
    }
  });
});
