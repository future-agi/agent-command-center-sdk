import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

describe("images", () => {
  itest("generate image", async (ctx) => {
    try {
      const r = await client.images.generate({
        model: "imagen-4.0-generate-001",
        prompt: "A small red circle on a white background.",
        n: 1,
      } as any);
      expect(r.data.length).toBe(1);
      expect(r.data[0].url || (r.data[0] as any).b64_json).toBeTruthy();
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks: ${e}`);
      throw e;
    }
  });
});
