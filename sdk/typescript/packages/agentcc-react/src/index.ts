// ---------------------------------------------------------------------------
// @agentcc/react — React hooks and components for AgentCC
// ---------------------------------------------------------------------------

export { AgentCCProvider, useAgentCCClient, AgentCCContext } from "./provider.js";
export type { AgentCCProviderProps } from "./provider.js";

export { useAgentCCChat, useAgentCCChatWithClient } from "./use-chat.js";
export { useAgentCCCompletion, useAgentCCCompletionWithClient } from "./use-completion.js";
export { useAgentCCObject, useAgentCCObjectWithClient } from "./use-object.js";

export type {
  ChatMessage,
  UseAgentCCChatOptions,
  UseAgentCCChatReturn,
  UseAgentCCCompletionOptions,
  UseAgentCCCompletionReturn,
  UseAgentCCObjectOptions,
  UseAgentCCObjectReturn,
} from "./types.js";
