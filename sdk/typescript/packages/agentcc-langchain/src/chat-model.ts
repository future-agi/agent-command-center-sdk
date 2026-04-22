// ---------------------------------------------------------------------------
// ChatAgentCC — LangChain-compatible chat model using the AgentCC gateway
// ---------------------------------------------------------------------------

import { AgentCC } from "@agentcc/client";

// ---------------------------------------------------------------------------
// Duck-typed LangChain interfaces (no hard @langchain/core dependency)
// ---------------------------------------------------------------------------

export interface LangChainMessage {
  _getType(): string;
  content: string;
  additional_kwargs?: Record<string, unknown>;
}

export interface ChatGeneration {
  text: string;
  message: LangChainMessage;
  generationInfo?: Record<string, unknown>;
}

export interface ChatResult {
  generations: ChatGeneration[];
  llmOutput?: Record<string, unknown>;
}

export interface ChatGenerationChunk {
  text: string;
  message: LangChainMessage;
  generationInfo?: Record<string, unknown>;
}

export interface CallbackManager {
  handleLLMNewToken?: (token: string) => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// ChatAgentCC options
// ---------------------------------------------------------------------------

export interface ChatAgentCCOptions {
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
  /** Enable streaming. */
  streaming?: boolean;
  /** Top-p sampling. */
  topP?: number;
  /** Additional AgentCC client options. */
  clientOptions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Message conversion helpers
// ---------------------------------------------------------------------------

function langchainToOpenAI(msg: LangChainMessage): {
  role: string;
  content: string;
} {
  const type = msg._getType();
  const roleMap: Record<string, string> = {
    human: "user",
    ai: "assistant",
    system: "system",
    tool: "tool",
    function: "function",
    generic: "user",
  };
  return {
    role: roleMap[type] ?? "user",
    content: msg.content,
  };
}

function makeAIMessage(content: string): LangChainMessage {
  return {
    _getType: () => "ai",
    content,
  };
}

// ---------------------------------------------------------------------------
// ChatAgentCC class
// ---------------------------------------------------------------------------

/**
 * LangChain-compatible chat model that routes through the AgentCC gateway.
 * Drop-in replacement for `ChatOpenAI` — provides all AgentCC gateway features
 * (routing, guardrails, caching, cost tracking) to LangChain chains.
 *
 * @example
 * ```typescript
 * import { ChatAgentCC } from "@agentcc/langchain";
 *
 * const model = new ChatAgentCC({
 *   agentccApiKey: "sk-...",
 *   model: "gpt-4o",
 *   temperature: 0,
 * });
 *
 * // Use in any LangChain chain
 * const result = await model.invoke([new HumanMessage("Hello!")]);
 * ```
 */
export class ChatAgentCC {
  private _client: AgentCC;
  private _model: string;
  private _temperature: number | undefined;
  private _maxTokens: number | undefined;
  private _topP: number | undefined;
  private _streaming: boolean;

  /** LangChain expects lc_namespace for serialization */
  static lc_name() {
    return "ChatAgentCC";
  }

  get lc_namespace(): string[] {
    return ["futureagi", "agentcc", "chat_models"];
  }

  constructor(options: ChatAgentCCOptions = {}) {
    this._client = new AgentCC({
      apiKey: options.agentccApiKey,
      baseUrl: options.agentccBaseUrl,
      ...(options.clientOptions ?? {}),
    });
    this._model = options.model ?? "gpt-4o";
    this._temperature = options.temperature;
    this._maxTokens = options.maxTokens;
    this._topP = options.topP;
    this._streaming = options.streaming ?? false;
  }

  /** The AgentCC client instance. */
  get client(): AgentCC {
    return this._client;
  }

  /** The model name. */
  get modelName(): string {
    return this._model;
  }

  /**
   * Generate a chat completion from a list of messages.
   * Conforms to LangChain's `BaseChatModel._generate()` contract.
   */
  async generate(
    messages: LangChainMessage[],
    options?: { stop?: string[] },
  ): Promise<ChatResult> {
    const openaiMessages = messages.map(langchainToOpenAI);

    const response = await this._client.chat.completions.create({
      model: this._model,
      messages: openaiMessages as any,
      temperature: this._temperature,
      max_tokens: this._maxTokens,
      top_p: this._topP,
      stop: options?.stop,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const usage = (response as any).usage;

    return {
      generations: [
        {
          text: content,
          message: makeAIMessage(content),
          generationInfo: {
            finish_reason: response.choices[0]?.finish_reason,
          },
        },
      ],
      llmOutput: {
        tokenUsage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
        modelName: this._model,
      },
    };
  }

  /**
   * Stream a chat completion, yielding generation chunks.
   * Conforms to LangChain's `BaseChatModel._stream()` contract.
   */
  async *stream(
    messages: LangChainMessage[],
    options?: { stop?: string[] },
  ): AsyncGenerator<ChatGenerationChunk> {
    const openaiMessages = messages.map(langchainToOpenAI);

    const streamMgr = await this._client.chat.completions.stream({
      model: this._model,
      messages: openaiMessages as any,
      temperature: this._temperature,
      max_tokens: this._maxTokens,
      top_p: this._topP,
      stop: options?.stop,
    });

    for await (const chunk of streamMgr) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield {
          text: content,
          message: makeAIMessage(content),
        };
      }
    }
  }

  /**
   * Simple invoke method — takes messages, returns content string.
   * Matches LangChain's Runnable pattern.
   */
  async invoke(
    messages: LangChainMessage[],
    options?: { stop?: string[] },
  ): Promise<LangChainMessage> {
    const result = await this.generate(messages, options);
    return result.generations[0].message;
  }
}
