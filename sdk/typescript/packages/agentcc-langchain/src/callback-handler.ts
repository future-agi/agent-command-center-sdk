// ---------------------------------------------------------------------------
// AgentCCCallbackHandler — Bridges LangChain callbacks to AgentCC callbacks
// ---------------------------------------------------------------------------

import type { CallbackHandler, CallbackRequest } from "@agentcc/client";

// ---------------------------------------------------------------------------
// LangChain callback interfaces (duck-typed)
// ---------------------------------------------------------------------------

export interface LangChainSerializedFields {
  type: string;
  id: string[];
  kwargs?: Record<string, unknown>;
}

export interface LangChainLLMResult {
  generations: Array<Array<{ text: string; generationInfo?: Record<string, unknown> }>>;
  llmOutput?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AgentCCCallbackHandler
// ---------------------------------------------------------------------------

export interface AgentCCCallbackHandlerOptions {
  /** AgentCC callbacks to forward events to. */
  callbacks: CallbackHandler[];
}

/**
 * Bridges LangChain callback events to AgentCC's callback system.
 * This allows unified observability across both LangChain and AgentCC.
 *
 * @example
 * ```typescript
 * import { AgentCCCallbackHandler } from "@agentcc/langchain";
 * import { LoggingCallback } from "@agentcc/client";
 *
 * const handler = new AgentCCCallbackHandler({
 *   callbacks: [new LoggingCallback()],
 * });
 *
 * const model = new ChatAgentCC({ ... });
 * // Use handler with LangChain's callback system
 * ```
 */
export class AgentCCCallbackHandler {
  name = "AgentCCCallbackHandler";
  private _callbacks: CallbackHandler[];
  private _activeRequests: Map<string, { startTime: number; model?: string }> = new Map();

  constructor(options: AgentCCCallbackHandlerOptions) {
    this._callbacks = options.callbacks;
  }

  /**
   * Called when an LLM starts generating.
   * Maps to AgentCC's onRequestStart callback.
   */
  async handleLLMStart(
    llm: LangChainSerializedFields,
    prompts: string[],
    runId: string,
    _parentRunId?: string,
    extraParams?: Record<string, unknown>,
  ): Promise<void> {
    this._activeRequests.set(runId, {
      startTime: Date.now(),
      model: extraParams?.model as string | undefined,
    });

    const cbReq: CallbackRequest = {
      method: "POST",
      url: `/langchain/${llm.id.join("/")}`,
      headers: {},
      body: {
        prompts,
        model: extraParams?.model,
        ...extraParams,
      },
    };

    for (const cb of this._callbacks) {
      try {
        cb.onRequestStart?.(cbReq);
      } catch {
        // Callbacks should not throw
      }
    }
  }

  /**
   * Called when an LLM finishes generating.
   * Maps to AgentCC's onRequestEnd callback.
   */
  async handleLLMEnd(
    output: LangChainLLMResult,
    runId: string,
  ): Promise<void> {
    const info = this._activeRequests.get(runId);
    this._activeRequests.delete(runId);

    const latencyMs = info ? Date.now() - info.startTime : 0;
    const tokenUsage = output.llmOutput?.tokenUsage as
      | { promptTokens?: number; completionTokens?: number; totalTokens?: number }
      | undefined;

    const cbReq: CallbackRequest = {
      method: "POST",
      url: "/langchain/completion",
      headers: {},
      body: { model: info?.model },
    };

    const cbResp = {
      statusCode: 200,
      headers: {},
      agentcc: {
        requestId: runId,
        traceId: runId,
        provider: "langchain",
        latencyMs,
        cost: null,
        cacheStatus: null,
        modelUsed: info?.model ?? null,
        guardrailTriggered: false,
        guardrailName: null,
        guardrailAction: null,
        guardrailConfidence: null,
        guardrailMessage: null,
        fallbackUsed: false,
        routingStrategy: null,
        timeoutMs: null,
        ratelimit: null,
      },
      body: {
        generations: output.generations,
        usage: tokenUsage
          ? {
              prompt_tokens: tokenUsage.promptTokens,
              completion_tokens: tokenUsage.completionTokens,
              total_tokens: tokenUsage.totalTokens,
            }
          : undefined,
      },
    };

    for (const cb of this._callbacks) {
      try {
        cb.onRequestEnd?.(cbReq, cbResp);
      } catch {
        // Callbacks should not throw
      }
    }
  }

  /**
   * Called when an LLM errors.
   * Maps to AgentCC's onError callback.
   */
  async handleLLMError(
    error: Error,
    runId: string,
  ): Promise<void> {
    this._activeRequests.delete(runId);

    const cbReq: CallbackRequest = {
      method: "POST",
      url: "/langchain/completion",
      headers: {},
      body: {},
    };

    for (const cb of this._callbacks) {
      try {
        cb.onError?.(cbReq, error);
      } catch {
        // Callbacks should not throw
      }
    }
  }

  /**
   * Called when an LLM streams a new token.
   */
  async handleLLMNewToken(
    token: string,
    _idx: { prompt: number; completion: number },
    runId: string,
  ): Promise<void> {
    // Could map to onStreamChunk, but we keep it simple for now
    void token;
    void runId;
  }
}
