// ---------------------------------------------------------------------------
// AgentCCLLM — LlamaIndex.TS-compatible LLM using the AgentCC gateway
// ---------------------------------------------------------------------------

import { AgentCC } from "@agentcc/client";

// ---------------------------------------------------------------------------
// Duck-typed LlamaIndex interfaces
// ---------------------------------------------------------------------------

export interface LlamaIndexChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  additionalKwargs?: Record<string, unknown>;
}

export interface LlamaIndexChatResponse {
  message: LlamaIndexChatMessage;
  raw?: Record<string, unknown>;
}

export interface LlamaIndexChatStreamResponse {
  delta: string;
}

export interface LlamaIndexCompletionResponse {
  text: string;
  raw?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface AgentCCLLMOptions {
  /** AgentCC API key. */
  agentccApiKey?: string;
  /** AgentCC gateway base URL. */
  agentccBaseUrl?: string;
  /** Model name (e.g. "gpt-4o"). */
  model?: string;
  /** Sampling temperature. */
  temperature?: number;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Top-p sampling. */
  topP?: number;
  /** Additional AgentCC client options. */
  clientOptions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AgentCCLLM class
// ---------------------------------------------------------------------------

/**
 * LlamaIndex.TS-compatible LLM that routes through the AgentCC gateway.
 * Implements the LLM interface contract for use in LlamaIndex pipelines.
 *
 * @example
 * ```typescript
 * import { AgentCCLLM } from "@agentcc/llamaindex";
 *
 * const llm = new AgentCCLLM({
 *   agentccApiKey: "sk-...",
 *   model: "gpt-4o",
 * });
 *
 * const response = await llm.chat({
 *   messages: [{ role: "user", content: "Hello!" }],
 * });
 * console.log(response.message.content);
 * ```
 */
export class AgentCCLLM {
  private _client: AgentCC;
  private _model: string;
  private _temperature: number | undefined;
  private _maxTokens: number | undefined;
  private _topP: number | undefined;

  constructor(options: AgentCCLLMOptions = {}) {
    this._client = new AgentCC({
      apiKey: options.agentccApiKey,
      baseUrl: options.agentccBaseUrl,
      ...(options.clientOptions ?? {}),
    });
    this._model = options.model ?? "gpt-4o";
    this._temperature = options.temperature;
    this._maxTokens = options.maxTokens;
    this._topP = options.topP;
  }

  /** The AgentCC client instance. */
  get client(): AgentCC {
    return this._client;
  }

  /** The model name. */
  get metadata(): { model: string; temperature: number | undefined; maxTokens: number | undefined } {
    return {
      model: this._model,
      temperature: this._temperature,
      maxTokens: this._maxTokens,
    };
  }

  /**
   * Chat completion with a list of messages.
   * Conforms to LlamaIndex's `LLM.chat()` contract.
   */
  async chat(params: {
    messages: LlamaIndexChatMessage[];
    parentEvent?: unknown;
    streaming?: false;
  }): Promise<LlamaIndexChatResponse> {
    const response = await this._client.chat.completions.create({
      model: this._model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: this._temperature,
      max_tokens: this._maxTokens,
      top_p: this._topP,
    });

    const content = response.choices[0]?.message?.content ?? "";

    return {
      message: {
        role: "assistant",
        content,
      },
      raw: response as unknown as Record<string, unknown>,
    };
  }

  /**
   * Streaming chat completion.
   * Yields partial content chunks.
   */
  async *chatStream(params: {
    messages: LlamaIndexChatMessage[];
  }): AsyncGenerator<LlamaIndexChatStreamResponse> {
    const streamMgr = await this._client.chat.completions.stream({
      model: this._model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: this._temperature,
      max_tokens: this._maxTokens,
      top_p: this._topP,
    });

    for await (const chunk of streamMgr) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        yield { delta };
      }
    }
  }

  /**
   * Simple text completion (wraps chat with a single user message).
   * Conforms to LlamaIndex's `LLM.complete()` contract.
   */
  async complete(params: {
    prompt: string;
  }): Promise<LlamaIndexCompletionResponse> {
    const result = await this.chat({
      messages: [{ role: "user", content: params.prompt }],
    });

    return {
      text: result.message.content,
      raw: result.raw,
    };
  }

  /**
   * Streaming text completion.
   */
  async *completeStream(params: {
    prompt: string;
  }): AsyncGenerator<LlamaIndexChatStreamResponse> {
    yield* this.chatStream({
      messages: [{ role: "user", content: params.prompt }],
    });
  }
}
