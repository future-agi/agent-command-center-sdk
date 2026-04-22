import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

describe("models", () => {
  itest("list models", async (ctx) => {
    try {
      const r = await client.models.list();
      expect(r.data).toBeDefined();
      expect(Array.isArray(r.data)).toBe(true);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks /v1/models: ${e}`);
      throw e;
    }
  });

  itest("retrieve a specific model", async (ctx) => {
    try {
      const r = await client.models.retrieve("gemini-2.0-flash");
      expect(r.id).toBeTruthy();
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks /v1/models/{id}: ${e}`);
      throw e;
    }
  });
});
