import { describe, it, expect, vi } from "vitest";
import { AgentCCEmbedding } from "../src/embedding.js";

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

describe("AgentCCEmbedding", () => {
  it("creates instance with defaults", () => {
    const emb = new AgentCCEmbedding({ agentccApiKey: "sk-test" });
    expect(emb.client).toBeDefined();
  });

  it("getTextEmbedding returns single vector", async () => {
    const mockFetch = mockEmbeddingResponse([[0.1, 0.2, 0.3]]);
    const emb = new AgentCCEmbedding({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await emb.getTextEmbedding("Hello");
    expect(result).toEqual([0.1, 0.2, 0.3]);
  });

  it("getTextEmbeddings returns multiple vectors", async () => {
    const mockFetch = mockEmbeddingResponse([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    const emb = new AgentCCEmbedding({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await emb.getTextEmbeddings(["Hello", "World"]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([0.1, 0.2]);
    expect(result[1]).toEqual([0.3, 0.4]);
  });

  it("getQueryEmbedding delegates to getTextEmbedding", async () => {
    const mockFetch = mockEmbeddingResponse([[0.5, 0.6]]);
    const emb = new AgentCCEmbedding({
      agentccApiKey: "sk-test",
      clientOptions: { fetch: mockFetch },
    });

    const result = await emb.getQueryEmbedding("query text");
    expect(result).toEqual([0.5, 0.6]);
  });

  it("passes model and dimensions", async () => {
    const mockFetch = mockEmbeddingResponse([[0.1]]);
    const emb = new AgentCCEmbedding({
      agentccApiKey: "sk-test",
      model: "text-embedding-3-large",
      dimensions: 512,
      clientOptions: { fetch: mockFetch },
    });

    await emb.getTextEmbedding("test");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("text-embedding-3-large");
    expect(body.dimensions).toBe(512);
  });
});
