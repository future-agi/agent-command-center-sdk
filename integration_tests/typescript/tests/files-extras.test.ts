import { describe, expect } from "vitest";
import { client, itestMutating, uniqName, isGatewayGap } from "./_helpers.js";

describe("files retrieve + content (mutating)", () => {
  itestMutating("retrieve file metadata + download content", async (ctx) => {
    const name = uniqName();
    const body = `integration-test content ${name}`;
    const content = new TextEncoder().encode(body);
    const file = new File([content], `${name}.txt`, { type: "text/plain" });

    let uploadedId: string | null = null;
    try {
      const uploaded = await client.files.create({ file, purpose: "batch" as any });
      uploadedId = uploaded.id;

      const fetched = await client.files.retrieve(uploadedId);
      expect(fetched.id).toBe(uploadedId);

      const res = await client.files.content(uploadedId);
      const text = await (res as Response).text();
      expect(text.length).toBeGreaterThan(0);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks files retrieve/content: ${e}`);
      throw e;
    } finally {
      if (uploadedId) await client.files.delete(uploadedId).catch(() => {});
    }
  });
});
