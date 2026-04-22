// ---------------------------------------------------------------------------
// AgentCCEmbedding — LlamaIndex.TS-compatible embeddings using AgentCC gateway
// ---------------------------------------------------------------------------

import { AgentCC } from "@agentcc/client";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface AgentCCEmbeddingOptions {
  /** AgentCC API key. */
  agentccApiKey?: string;
  /** AgentCC gateway base URL. */
  agentccBaseUrl?: string;
  /** Embedding model name (e.g. "text-embedding-3-small"). */
  model?: string;
  /** Number of dimensions for the embedding (if model supports it). */
  dimensions?: number;
  /** Additional AgentCC client options. */
  clientOptions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AgentCCEmbedding class
// ---------------------------------------------------------------------------

/**
 * LlamaIndex.TS-compatible embedding class that routes through the AgentCC gateway.
 * Implements the BaseEmbedding interface contract.
 *
 * @example
 * ```typescript
 * import { AgentCCEmbedding } from "@agentcc/llamaindex";
 *
 * const embedModel = new AgentCCEmbedding({
 *   agentccApiKey: "sk-...",
 *   model: "text-embedding-3-small",
 * });
 *
 * const embedding = await embedModel.getTextEmbedding("Hello, world!");
 * ```
 */
export class AgentCCEmbedding {
  private _client: AgentCC;
  private _model: string;
  private _dimensions: number | undefined;

  constructor(options: AgentCCEmbeddingOptions = {}) {
    this._client = new AgentCC({
      apiKey: options.agentccApiKey,
      baseUrl: options.agentccBaseUrl,
      ...(options.clientOptions ?? {}),
    });
    this._model = options.model ?? "text-embedding-3-small";
    this._dimensions = options.dimensions;
  }

  /** The AgentCC client instance. */
  get client(): AgentCC {
    return this._client;
  }

  /**
   * Get embedding for a single text.
   * Conforms to LlamaIndex's `BaseEmbedding.getTextEmbedding()` contract.
   */
  async getTextEmbedding(text: string): Promise<number[]> {
    const response = await this._client.embeddings.create({
      model: this._model,
      input: text,
      dimensions: this._dimensions,
    } as any);

    const data = (response as any).data as Array<{ embedding: number[] }>;
    return data[0].embedding;
  }

  /**
   * Get embeddings for multiple texts.
   * Conforms to LlamaIndex's `BaseEmbedding.getTextEmbeddings()` contract.
   */
  async getTextEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this._client.embeddings.create({
      model: this._model,
      input: texts,
      dimensions: this._dimensions,
    } as any);

    const data = (response as any).data as Array<{ embedding: number[] }>;
    return data.map((item) => item.embedding);
  }

  /**
   * Get embedding for a query (same as getTextEmbedding but semantically distinct).
   * Some embedding models handle queries differently from documents.
   */
  async getQueryEmbedding(query: string): Promise<number[]> {
    return this.getTextEmbedding(query);
  }
}
