// ---------------------------------------------------------------------------
// useAgentCCCompletion — Single completion hook
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import type { AgentCC } from "@agentcc/client";
import { useAgentCCClient } from "./provider.js";
import type {
  UseAgentCCCompletionOptions,
  UseAgentCCCompletionReturn,
} from "./types.js";

/**
 * React hook for single (non-streaming) chat completions via AgentCC.
 *
 * @example
 * ```tsx
 * function TranslatePage() {
 *   const { completion, isLoading, complete } = useAgentCCCompletion({
 *     model: "gpt-4o",
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={() => complete("Translate 'hello' to French")}>
 *         Translate
 *       </button>
 *       {isLoading && <p>Loading...</p>}
 *       {completion && <p>{completion}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgentCCCompletion(
  options: UseAgentCCCompletionOptions,
): UseAgentCCCompletionReturn {
  const client = useAgentCCClient();
  return useAgentCCCompletionWithClient(client, options);
}

export function useAgentCCCompletionWithClient(
  client: AgentCC,
  options: UseAgentCCCompletionOptions,
): UseAgentCCCompletionReturn {
  const { model, onError } = options;

  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const complete = useCallback(
    async (prompt: string) => {
      setIsLoading(true);
      setError(null);
      setCompletion("");

      try {
        const response = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
        });

        const text = response.choices?.[0]?.message?.content ?? "";
        setCompletion(text);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        if (onError) onError(e);
      } finally {
        setIsLoading(false);
      }
    },
    [client, model, onError],
  );

  return { completion, isLoading, error, complete };
}
