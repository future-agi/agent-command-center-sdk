// ---------------------------------------------------------------------------
// AgentCCProvider — Vercel AI SDK provider backed by the AgentCC AI Gateway
//
// Wraps @ai-sdk/openai with AgentCC gateway URL and headers, giving full
// Vercel AI SDK compatibility (tools, streaming, structured output, etc.)
// while routing through AgentCC's gateway features.
// ---------------------------------------------------------------------------

import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface AgentCCProviderSettings {
  /** AgentCC API key. Falls back to AGENTCC_API_KEY env var. */
  apiKey?: string;

  /** AgentCC gateway base URL. Falls back to AGENTCC_GATEWAY_URL or AGENTCC_BASE_URL env var. */
  baseURL?: string;

  /** Additional HTTP headers merged into every request. */
  headers?: Record<string, string>;

  // -- AgentCC gateway features -----------------------------------------------

  /**
   * Gateway routing config object (fallback, load-balance, etc.).
   * Serialized as the `x-agentcc-config` header.
   */
  config?: Record<string, unknown>;

  /** Trace ID for request correlation. */
  traceId?: string;

  /** Session ID for multi-turn conversation grouping. */
  sessionId?: string;

  /** Arbitrary metadata attached to the request log. */
  metadata?: Record<string, unknown>;

  /** User ID for per-user tracking and rate limiting. */
  userId?: string;

  /** Enable gateway-level semantic caching. */
  cacheEnabled?: boolean;

  /** Cache TTL (e.g. "5m", "1h"). Only used when cacheEnabled is true. */
  cacheTtl?: string;

  /** Guardrail policy name or ID to apply. */
  guardrailPolicy?: string;

  /** Custom properties to attach to the request. */
  properties?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Header builder
// ---------------------------------------------------------------------------

function buildAgentCCHeaders(
  settings: AgentCCProviderSettings,
): Record<string, string> {
  const h: Record<string, string> = {};

  if (settings.config) {
    h["x-agentcc-config"] = JSON.stringify(settings.config);
  }
  if (settings.traceId) {
    h["x-agentcc-trace-id"] = settings.traceId;
  }
  if (settings.sessionId) {
    h["x-agentcc-session-id"] = settings.sessionId;
  }
  if (settings.metadata) {
    h["x-agentcc-metadata"] = JSON.stringify(settings.metadata);
  }
  if (settings.userId) {
    h["x-agentcc-user-id"] = settings.userId;
  }
  if (settings.cacheEnabled) {
    h["x-agentcc-cache"] = "true";
    if (settings.cacheTtl) {
      h["x-agentcc-cache-ttl"] = settings.cacheTtl;
    }
  }
  if (settings.guardrailPolicy) {
    h["x-agentcc-guardrail-policy"] = settings.guardrailPolicy;
  }
  if (settings.properties) {
    for (const [k, v] of Object.entries(settings.properties)) {
      h[`x-agentcc-property-${k}`] = v;
    }
  }

  return h;
}

// ---------------------------------------------------------------------------
// Env helpers (safe for edge runtimes)
// ---------------------------------------------------------------------------

function env(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// createAgentCC
// ---------------------------------------------------------------------------

/**
 * Create a AgentCC provider for the Vercel AI SDK.
 *
 * Returns an OpenAI-compatible provider pointed at the AgentCC gateway,
 * with all AgentCC headers (routing config, guardrails, caching, etc.)
 * automatically injected into every request.
 *
 * @example
 * ```typescript
 * import { createAgentCC } from "@agentcc/vercel";
 * import { generateText } from "ai";
 *
 * const agentcc = createAgentCC({ apiKey: "sk-..." });
 *
 * const { text } = await generateText({
 *   model: agentcc("gpt-4o"),
 *   prompt: "Hello!",
 * });
 * ```
 *
 * @example With gateway features
 * ```typescript
 * const agentcc = createAgentCC({
 *   config: {
 *     strategy: "fallback",
 *     targets: [
 *       { provider: "openai", model: "gpt-4o" },
 *       { provider: "anthropic", model: "claude-sonnet-4-20250514" },
 *     ],
 *   },
 *   cacheEnabled: true,
 *   cacheTtl: "5m",
 *   guardrailPolicy: "pii-block",
 * });
 *
 * const { text } = await generateText({
 *   model: agentcc("gpt-4o"),
 *   prompt: "Summarize this document...",
 * });
 * ```
 *
 * @example Streaming with tools
 * ```typescript
 * import { streamText } from "ai";
 * import { z } from "zod";
 *
 * const result = await streamText({
 *   model: agentcc("gpt-4o"),
 *   prompt: "What's the weather in London?",
 *   tools: {
 *     weather: {
 *       description: "Get current weather",
 *       parameters: z.object({ city: z.string() }),
 *       execute: async ({ city }) => ({ temp: 18, unit: "C" }),
 *     },
 *   },
 * });
 *
 * for await (const chunk of result.textStream) {
 *   process.stdout.write(chunk);
 * }
 * ```
 */
export function createAgentCC(
  settings: AgentCCProviderSettings = {},
): OpenAIProvider {
  const apiKey = settings.apiKey || env("AGENTCC_API_KEY") || "";
  const baseURL =
    settings.baseURL ||
    env("AGENTCC_GATEWAY_URL") ||
    env("AGENTCC_BASE_URL") ||
    "https://api.agentcc.ai/v1";

  const agentccHeaders = buildAgentCCHeaders(settings);

  return createOpenAI({
    apiKey,
    baseURL,
    headers: {
      ...agentccHeaders,
      ...settings.headers,
    },
    compatibility: "compatible",
  });
}
