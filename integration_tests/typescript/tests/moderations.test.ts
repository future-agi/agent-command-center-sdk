import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

describe("moderations", () => {
  itest("well-formed response", async (ctx) => {
    try {
      const r = await client.moderations.create({
        model: "omni-moderation-latest",
        input: "Weather in Bangalore today.",
      });
      expect(r.results).toHaveLength(1);
      expect(r.results[0].categories).toBeDefined();
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks: ${e}`);
      throw e;
    }
  });
});
