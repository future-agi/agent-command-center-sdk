// ---------------------------------------------------------------------------
// AgentCCEmbeddings — LangChain-compatible embeddings using AgentCC gateway
// ---------------------------------------------------------------------------

import { AgentCC } from "@agentcc/client";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface AgentCCEmbeddingsOptions {
  /** AgentCC API key. */
  agentccApiKey?: string;
  /** AgentCC gateway base URL. */
  agentccBaseUrl?: string;
  /** Embedding model name (e.g. "text-embedding-3-small"). */
  model?: string;
  /** Number of dimensions for the embedding (if model supports it). */
  dimensions?: number;
  /** Batch size for embedding multiple documents. */
  batchSize?: number;
  /** Additional AgentCC client options. */
  clientOptions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AgentCCEmbeddings class
// ---------------------------------------------------------------------------

/**
 * LangChain-compatible embeddings class that routes through the AgentCC gateway.
 * Drop-in replacement for `OpenAIEmbeddings`.
 *
 * @example
 * ```typescript
 * import { AgentCCEmbeddings } from "@agentcc/langchain";
 *
 * const embeddings = new AgentCCEmbeddings({
 *   agentccApiKey: "sk-...",
 *   model: "text-embedding-3-small",
 * });
 *
 * const vectors = await embeddings.embedDocuments(["Hello", "World"]);
 * ```
 */
export class AgentCCEmbeddings {
  private _client: AgentCC;
  private _model: string;
  private _dimensions: number | undefined;
  private _batchSize: number;

  constructor(options: AgentCCEmbeddingsOptions = {}) {
    this._client = new AgentCC({
      apiKey: options.agentccApiKey,
      baseUrl: options.agentccBaseUrl,
      ...(options.clientOptions ?? {}),
    });
    this._model = options.model ?? "text-embedding-3-small";
    this._dimensions = options.dimensions;
    this._batchSize = options.batchSize ?? 512;
  }

  /** The AgentCC client instance. */
  get client(): AgentCC {
    return this._client;
  }

  /**
   * Embed a list of documents.
   * Conforms to LangChain's `Embeddings.embedDocuments()` contract.
   */
  async embedDocuments(documents: string[]): Promise<number[][]> {
    const results: number[][] = [];

    // Process in batches
    for (let i = 0; i < documents.length; i += this._batchSize) {
      const batch = documents.slice(i, i + this._batchSize);
      const response = await this._client.embeddings.create({
        model: this._model,
        input: batch,
        dimensions: this._dimensions,
      } as any);

      const data = (response as any).data as Array<{ embedding: number[] }>;
      for (const item of data) {
        results.push(item.embedding);
      }
    }

    return results;
  }

  /**
   * Embed a single query text.
   * Conforms to LangChain's `Embeddings.embedQuery()` contract.
   */
  async embedQuery(text: string): Promise<number[]> {
    const response = await this._client.embeddings.create({
      model: this._model,
      input: text,
      dimensions: this._dimensions,
    } as any);

    const data = (response as any).data as Array<{ embedding: number[] }>;
    return data[0].embedding;
  }
}
