// ---------------------------------------------------------------------------
// @agentcc/vercel — Vercel AI SDK provider for AgentCC AI Gateway
// ---------------------------------------------------------------------------

export { createAgentCC } from "./agentcc-provider.js";
export type { AgentCCProviderSettings } from "./agentcc-provider.js";

// Re-export the OpenAIProvider type so users can type their variables
export type { OpenAIProvider } from "@ai-sdk/openai";
