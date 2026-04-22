import { describe, it, expect, vi } from "vitest";
import { AgentCCEmbeddings } from "../src/embeddings.js";

function mockEmbeddingResponse(embeddings: number[][]) {
  return vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: embeddings.map((e, i) => ({ embedding: e, index: i })),
        model: "text-embedding-3-small",
        usage: { prompt_tokens: 10, total_tokens: 10 },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
}

describe("AgentCCEmbeddings", () => {
  it("creates instance with default model", () => {
    const emb = new AgentCCEmbeddings({ agentccApiKey: "sk-test" });
    expect(emb.client).toBeDefined();
  });

  it("embedQuery returns a single vector", async () => {
    const mockFetch = mockEmbeddingResponse([[0.1, 0.2, 0.3]]);
    const emb = new AgentCCEmbeddings({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await emb.embedQuery("Hello");
    expect(result).toEqual([0.1, 0.2, 0.3]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("embedDocuments returns multiple vectors", async () => {
    const mockFetch = mockEmbeddingResponse([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    const emb = new AgentCCEmbeddings({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await emb.embedDocuments(["Hello", "World"]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([0.1, 0.2]);
    expect(result[1]).toEqual([0.3, 0.4]);
  });

  it("passes model and dimensions to API", async () => {
    const mockFetch = mockEmbeddingResponse([[0.1]]);
    const emb = new AgentCCEmbeddings({
      agentccApiKey: "sk-test",
      model: "text-embedding-3-large",
      dimensions: 256,
      clientOptions: { fetch: mockFetch },
    });

    await emb.embedQuery("test");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("text-embedding-3-large");
    expect(body.dimensions).toBe(256);
  });
});
