import { BaseClient, type ClientOptions } from "./base-client.js";
import { Chat } from "./resources/chat/index.js";
import { Embeddings } from "./resources/embeddings.js";
import { Images } from "./resources/images.js";
import { Audio } from "./resources/audio.js";
import { Models } from "./resources/models.js";
import { Moderations } from "./resources/moderations.js";
import { Completions } from "./resources/completions.js";
import { Batches } from "./resources/batches.js";
import { Files } from "./resources/files.js";
import { Rerank } from "./resources/rerank.js";
import { Session, type SessionOptions } from "./session.js";
import { invokeCallbacks } from "./callbacks.js";

/**
 * AgentCC client — the main entry point for the SDK.
 *
 * @example
 * ```typescript
 * import { AgentCC } from "@agentcc/client";
 *
 * const client = new AgentCC({ apiKey: "sk-..." });
 *
 * const response = await client.chat.completions.create({
 *   model: "gpt-4o",
 *   messages: [{ role: "user", content: "Hello!" }],
 * });
 * ```
 */
export class AgentCC extends BaseClient {
  public readonly chat: Chat;
  public readonly completions: Completions;
  public readonly embeddings: Embeddings;
  public readonly images: Images;
  public readonly audio: Audio;
  public readonly models: Models;
  public readonly moderations: Moderations;
  public readonly batches: Batches;
  public readonly files: Files;
  public readonly rerank: Rerank;

  constructor(opts: ClientOptions = {}) {
    super(opts);
    this.chat = new Chat(this);
    this.completions = new Completions(this);
    this.embeddings = new Embeddings(this);
    this.images = new Images(this);
    this.audio = new Audio(this);
    this.models = new Models(this);
    this.moderations = new Moderations(this);
    this.batches = new Batches(this);
    this.files = new Files(this);
    this.rerank = new Rerank(this);
  }

  /**
   * Create a new client with the same config but overridden options.
   */
  withOptions(overrides: Partial<ClientOptions>): AgentCC {
    return new AgentCC({
      apiKey: this._apiKey,
      baseUrl: this._baseUrl,
      timeout: this._timeout,
      maxRetries: this._maxRetries,
      defaultHeaders: { ...this._defaultHeaders },
      defaultQuery: { ...this._defaultQuery },
      sessionId: this._sessionId,
      metadata: this._metadata ? { ...this._metadata } : undefined,
      config: this._config,
      fetch: this._fetch,
      callbacks: this._callbacks.length > 0 ? [...this._callbacks] : undefined,
      retryPolicy: this._retryPolicy,
      dropParams: this._dropParams,
      modifyParams: this._modifyParams,
      redactMessages: this._redactMessages,
      traceContext: this._traceManager?.enabled,
      preCallRules: this._preCallRules.length > 0 ? [...this._preCallRules] : undefined,
      enableJsonSchemaValidation: this._enableJsonSchemaValidation || undefined,
      ...overrides,
    });
  }

  /**
   * Create a session-scoped client. All requests made through the returned
   * client include session headers and track session-level metrics.
   *
   * @example
   * ```typescript
   * const sess = client.session({ name: "research-agent" });
   * await sess.client.chat.completions.create({...});
   * sess.session.step("summarize");
   * await sess.client.chat.completions.create({...});
   * console.log(sess.session.totalCost, sess.session.requestCount);
   * ```
   */
  session(opts?: SessionOptions): { client: AgentCC; session: Session } {
    const session = new Session(opts);

    // Create a tracking callback that records cost/tokens per request
    const trackingCallback = new SessionTrackingCallback(session);

    // Create a scoped client with session headers injected
    const scopedClient = this.withOptions({
      defaultHeaders: {
        ...this._defaultHeaders,
        ...session.toHeaders(),
      },
      callbacks: [...this._callbacks, trackingCallback],
    });

    // Fire onSessionStart callbacks
    if (this._callbacks.length > 0) {
      invokeCallbacks(this._callbacks, "onSessionStart", session).catch(
        () => {},
      );
    }

    return { client: scopedClient, session };
  }

  /**
   * Quick health check against the gateway.
   * Returns `true` if the gateway is reachable and healthy.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request({ method: "GET", path: "/healthz" });
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Internal: session tracking callback
// ---------------------------------------------------------------------------

class SessionTrackingCallback {
  private _session: Session;

  constructor(session: Session) {
    this._session = session;
  }

  onRequestEnd(
    _request: unknown,
    response: { agentcc?: { cost?: number | null; latencyMs?: number } },
  ): void {
    const cost = response?.agentcc?.cost ?? 0;
    this._session.trackRequest(cost, 0);
  }

  // Satisfy CallbackHandler shape — no-ops for all other hooks
  onRequestStart() {}
  onStreamStart() {}
  onStreamChunk() {}
  onStreamEnd() {}
  onError() {}
  onRetry() {}
  onGuardrailWarning() {}
  onGuardrailBlock() {}
  onCacheHit() {}
  onCostUpdate() {}
  onBudgetWarning() {}
  onFallback() {}
  onSessionStart() {}
  onSessionEnd() {}
}
