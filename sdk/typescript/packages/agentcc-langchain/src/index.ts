// ---------------------------------------------------------------------------
// @agentcc/langchain — LangChain.js integration for AgentCC
// ---------------------------------------------------------------------------

export { ChatAgentCC } from "./chat-model.js";
export type {
  ChatAgentCCOptions,
  LangChainMessage,
  ChatGeneration,
  ChatResult,
  ChatGenerationChunk,
} from "./chat-model.js";

export { AgentCCEmbeddings } from "./embeddings.js";
export type { AgentCCEmbeddingsOptions } from "./embeddings.js";

export { AgentCCCallbackHandler } from "./callback-handler.js";
export type {
  AgentCCCallbackHandlerOptions,
  LangChainSerializedFields,
  LangChainLLMResult,
} from "./callback-handler.js";
