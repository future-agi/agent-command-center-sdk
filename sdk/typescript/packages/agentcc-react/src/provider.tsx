// ---------------------------------------------------------------------------
// AgentCCProvider — React context for AgentCC client
// ---------------------------------------------------------------------------

import { createContext, useContext, type ReactNode } from "react";
import type { AgentCC } from "@agentcc/client";

const AgentCCContext = createContext<AgentCC | null>(null);

export interface AgentCCProviderProps {
  /** The AgentCC client instance. */
  client: AgentCC;
  children: ReactNode;
}

/**
 * Provides a AgentCC client to all child components via React context.
 *
 * @example
 * ```tsx
 * import { AgentCC } from "@agentcc/client";
 * import { AgentCCProvider } from "@agentcc/react";
 *
 * const client = new AgentCC({ apiKey: "sk-..." });
 *
 * function App() {
 *   return (
 *     <AgentCCProvider client={client}>
 *       <ChatPage />
 *     </AgentCCProvider>
 *   );
 * }
 * ```
 */
export function AgentCCProvider({ client, children }: AgentCCProviderProps) {
  return (
    <AgentCCContext.Provider value={client}>{children}</AgentCCContext.Provider>
  );
}

/**
 * Access the AgentCC client from the nearest AgentCCProvider.
 * Throws if used outside a AgentCCProvider.
 */
export function useAgentCCClient(): AgentCC {
  const client = useContext(AgentCCContext);
  if (!client) {
    throw new Error(
      "useAgentCCClient must be used within a <AgentCCProvider>. " +
        "Wrap your component tree with <AgentCCProvider client={agentccClient}>.",
    );
  }
  return client;
}

export { AgentCCContext };
