// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
export { AgentCC } from "./client.js";
export type { ClientOptions, WithResponseResult } from "./base-client.js";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export {
  AgentCCError,
  APIConnectionError,
  APITimeoutError,
  APIStatusError,
  BadRequestError,
  AuthenticationError,
  PermissionDeniedError,
  NotFoundError,
  UnprocessableEntityError,
  RateLimitError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  GuardrailBlockedError,
  GuardrailWarning,
  StreamError,
} from "./errors.js";

// ---------------------------------------------------------------------------
// Gateway Configuration
// ---------------------------------------------------------------------------
export type {
  GatewayConfig,
  FallbackConfig,
  FallbackTarget,
  LoadBalanceConfig,
  LoadBalanceTarget,
  CacheConfig,
  GuardrailConfig,
  GuardrailCheck,
  ConditionalRoutingConfig,
  RoutingCondition,
  TrafficMirrorConfig,
  RetryConfig,
  TimeoutConfig,
  CreateHeadersOptions,
} from "./gateway-config.js";
export { createHeaders } from "./gateway-config.js";

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------
export { Stream, StreamManager, ChunkAccumulator } from "./streaming.js";
export type { StreamEvent } from "./stream-events.js";

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export { Session } from "./session.js";
export type { SessionOptions } from "./session.js";

// ---------------------------------------------------------------------------
// Callbacks
// ---------------------------------------------------------------------------
export { CallbackHandler, invokeCallbacks } from "./callbacks.js";
export type {
  CallbackRequest,
  CallbackResponse,
  StreamInfo,
  SessionSummary,
} from "./callbacks.js";
export {
  LoggingCallback,
  MetricsCallback,
  JSONLoggingCallback,
} from "./callbacks-builtin.js";

// ---------------------------------------------------------------------------
// Retry Policy
// ---------------------------------------------------------------------------
export { RetryPolicy } from "./retry-policy.js";
export type { RetryPolicyOptions } from "./retry-policy.js";

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------
export { redactCallbackRequest } from "./redact.js";

// ---------------------------------------------------------------------------
// Constants & Utilities
// ---------------------------------------------------------------------------
export { VERSION, NOT_GIVEN, AGENTCC_GATEWAY_URL } from "./constants.js";
export type { NotGiven } from "./constants.js";

// ---------------------------------------------------------------------------
// Model Info & Token Utilities
// ---------------------------------------------------------------------------
export type { ModelInfo } from "./models-info.js";
export {
  getModelInfo,
  getValidModels,
  registerModel,
  modelAliasMap,
  supportsVision,
  supportsFunctionCalling,
  supportsJsonMode,
  supportsResponseSchema,
  validateEnvironment,
} from "./models-info.js";
export {
  tokenCounter,
  getMaxTokens,
  getMaxOutputTokens,
  completionCost,
  completionCostFromResponse,
  trimMessages,
  getContextWindowFallback,
  getContentPolicyFallback,
  isPromptCachingValid,
} from "./tokens.js";
export type { ChatMessage } from "./tokens.js";

// ---------------------------------------------------------------------------
// Budget Management
// ---------------------------------------------------------------------------
export { BudgetManager } from "./budget.js";
export type { BudgetManagerOptions } from "./budget.js";

// ---------------------------------------------------------------------------
// Trace Context (W3C)
// ---------------------------------------------------------------------------
export {
  TraceContextManager,
  generateTraceId,
  generateSpanId,
  parseTraceparent,
  formatTraceparent,
} from "./trace-context.js";
export type {
  TraceContext,
  TraceContextManagerOptions,
} from "./trace-context.js";

// ---------------------------------------------------------------------------
// OpenTelemetry Callback
// ---------------------------------------------------------------------------
export { OTelCallback } from "./otel-callback.js";
export type {
  OTelCallbackOptions,
  OTelTracer,
  OTelSpan,
  OTelMeter,
  OTelCounter,
  OTelHistogram,
} from "./otel-callback.js";

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export { createMiddleware, composeMiddlewares } from "./middleware.js";
export type {
  Middleware,
  MiddlewareContext,
  MiddlewareResult,
  NextFn,
} from "./middleware.js";

// ---------------------------------------------------------------------------
// Structured Output & Zod
// ---------------------------------------------------------------------------
export { zodToJsonSchema, isZodSchema } from "./structured-output.js";

// ---------------------------------------------------------------------------
// Function → Tool Definition
// ---------------------------------------------------------------------------
export { functionToTool } from "./function-to-tool.js";
export type { FunctionToToolOptions } from "./function-to-tool.js";

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export { PaginatedList } from "./pagination.js";

// ---------------------------------------------------------------------------
// Batch Execution
// ---------------------------------------------------------------------------
export { batchCompletion, batchCompletionModels } from "./batch.js";
export type {
  BatchCompletionParams,
  BatchCompletionModelsParams,
  ModelCompletionResult,
} from "./batch.js";

// ---------------------------------------------------------------------------
// Tool Execution Loop
// ---------------------------------------------------------------------------
export { RunToolsRunner } from "./run-tools.js";
export type {
  ToolWithExecute,
  ToolStep,
  RunToolsResult,
  RunToolsParams,
} from "./run-tools.js";

// ---------------------------------------------------------------------------
// Migration Helpers
// ---------------------------------------------------------------------------
export { patchOpenAI } from "./patch-openai.js";

// ---------------------------------------------------------------------------
// Response Validation
// ---------------------------------------------------------------------------
export { validateJsonResponse, toResponseFormat } from "./validate-response.js";
export type { ValidationResult } from "./validate-response.js";

// ---------------------------------------------------------------------------
// Pre-Call Rules
// ---------------------------------------------------------------------------
export {
  evaluatePreCallRules,
  allowModels,
  blockModels,
  requireSessionId,
} from "./pre-call-rules.js";
export type {
  PreCallRule,
  PreCallRuleInput,
  PreCallRuleResult,
} from "./pre-call-rules.js";

// ---------------------------------------------------------------------------
// Dry Run
// ---------------------------------------------------------------------------
export type { DryRunResult } from "./dry-run.js";

// ---------------------------------------------------------------------------
// Token Encoding
// ---------------------------------------------------------------------------
export { encode, decode, getEncodingForModel } from "./token-encoding.js";

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
export { checkValidKey, healthCheck } from "./health-check.js";
export type {
  CheckValidKeyOptions,
  CheckValidKeyResult,
  HealthCheckOptions,
  HealthCheckResult as HealthCheckResponse,
} from "./health-check.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  // Shared
  Usage,
  AgentCCMetadata,
  RateLimitInfo,
  // Chat
  ChatCompletion,
  Choice,
  ChatCompletionMessage,
  ToolCall,
  FunctionCall,
  ChatCompletionChunk,
  StreamChoice,
  Delta,
  ToolCallDelta,
  FunctionCallDelta,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ContentPart,
  ToolDefinition,
  FunctionDefinition,
  ResponseFormat,
  // Embeddings
  Embedding,
  EmbeddingResponse,
  EmbeddingCreateParams,
  // Images
  ImageData,
  ImageResponse,
  ImageGenerateParams,
  // Audio
  Transcription,
  Translation,
  TranscriptionCreateParams,
  TranslationCreateParams,
  SpeechCreateParams,
  // Models
  Model,
  ModelList,
  // Moderations
  ModerationResult,
  ModerationResponse,
  ModerationCreateParams,
  // Legacy completions
  Completion,
  CompletionChoice,
  CompletionCreateParams,
  // Batches
  Batch,
  BatchList,
  BatchCreateParams,
  // Files
  FileObject,
  FileList,
  FileUploadParams,
  // Rerank
  RerankResult,
  RerankResponse,
  RerankParams,
} from "./types/index.js";
