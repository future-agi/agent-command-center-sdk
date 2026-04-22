import { describe, expect } from "vitest";
import { client, itestMutating, uniqName, isGatewayGap } from "./_helpers.js";

describe("files + batches (mutating)", () => {
  itestMutating("upload → list → delete", async (ctx) => {
    const name = uniqName();
    const content = new TextEncoder().encode(`integration test file ${name}`);
    const file = new File([content], `${name}.txt`, { type: "text/plain" });

    let uploadedId: string | null = null;
    try {
      const uploaded = await client.files.create({ file, purpose: "batch" as any });
      uploadedId = uploaded.id;
      expect(uploaded.id).toBeTruthy();

      const listing = await client.files.list();
      expect(listing.data.some((f: any) => f.id === uploadedId)).toBe(true);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks files: ${e}`);
      throw e;
    } finally {
      if (uploadedId) {
        await client.files.delete(uploadedId).catch(() => {});
      }
    }
  });

  itestMutating("batch create → retrieve → cancel", async (ctx) => {
    const name = uniqName();
    const line = JSON.stringify({
      custom_id: `${name}-1`,
      method: "POST",
      url: "/v1/chat/completions",
      body: {
        model: "gemini-2.0-flash",
        messages: [{ role: "user", content: "ok" }],
        max_tokens: 3,
      },
    });
    const content = new TextEncoder().encode(line + "\n");
    const file = new File([content], `${name}.jsonl`, { type: "application/jsonl" });

    let uploadedId: string | null = null;
    let batchId: string | null = null;
    try {
      const uploaded = await client.files.create({ file, purpose: "batch" as any });
      uploadedId = uploaded.id;
      const batch = await client.batches.create({
        input_file_id: uploaded.id,
        endpoint: "/v1/chat/completions",
        completion_window: "24h",
      } as any);
      batchId = batch.id;
      const fetched = await client.batches.retrieve(batch.id);
      expect(fetched.id).toBe(batch.id);
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks batches: ${e}`);
      throw e;
    } finally {
      if (batchId) await client.batches.cancel(batchId).catch(() => {});
      if (uploadedId) await client.files.delete(uploadedId).catch(() => {});
    }
  });
});
