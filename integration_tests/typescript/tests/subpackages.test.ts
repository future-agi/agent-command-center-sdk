import { describe, expect } from "vitest";
import { itest } from "./_helpers.js";

async function tryImport(mod: string): Promise<any | null> {
  try {
    return await import(mod);
  } catch {
    return null;
  }
}

describe("sub-package smoke tests", () => {
  itest("@agentcc/vercel exposes createAgentCC", async (ctx) => {
    const m = await tryImport("@agentcc/vercel");
    if (!m) return ctx.skip("@agentcc/vercel not installed in this workspace");
    expect(typeof m.createAgentCC).toBe("function");
  });

  itest("@agentcc/react exposes provider + hooks", async (ctx) => {
    const m = await tryImport("@agentcc/react");
    if (!m) return ctx.skip("@agentcc/react not installed in this workspace");
    expect(m.AgentCCProvider).toBeDefined();
    expect(typeof m.useAgentCCChat).toBe("function");
    expect(typeof m.useAgentCCCompletion).toBe("function");
    expect(typeof m.useAgentCCObject).toBe("function");
  });

  itest("@agentcc/llamaindex exposes AgentCCLLM + AgentCCEmbedding", async (ctx) => {
    const m = await tryImport("@agentcc/llamaindex");
    if (!m) return ctx.skip("@agentcc/llamaindex not installed in this workspace");
    expect(m.AgentCCLLM).toBeDefined();
    expect(m.AgentCCEmbedding).toBeDefined();
  });

  itest("@agentcc/langchain exposes ChatAgentCC + embeddings + callback", async (ctx) => {
    const m = await tryImport("@agentcc/langchain");
    if (!m) return ctx.skip("@agentcc/langchain not installed in this workspace");
    expect(m.ChatAgentCC).toBeDefined();
    expect(m.AgentCCEmbeddings).toBeDefined();
    expect(m.AgentCCCallbackHandler).toBeDefined();
  });
});
