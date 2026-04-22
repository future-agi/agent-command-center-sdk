// ---------------------------------------------------------------------------
// useAgentCCObject — Structured output hook
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import type { AgentCC } from "@agentcc/client";
import { useAgentCCClient } from "./provider.js";
import type {
  UseAgentCCObjectOptions,
  UseAgentCCObjectReturn,
} from "./types.js";

/**
 * React hook for structured output completions via AgentCC.
 * Uses `response_format: { type: "json_schema" }` to get typed JSON.
 *
 * @example
 * ```tsx
 * const schema = {
 *   type: "object",
 *   properties: {
 *     temp: { type: "number" },
 *     condition: { type: "string" },
 *   },
 *   required: ["temp", "condition"],
 * };
 *
 * function WeatherWidget() {
 *   const { object, isLoading, submit } = useAgentCCObject<{ temp: number; condition: string }>({
 *     model: "gpt-4o",
 *     schema,
 *     schemaName: "weather",
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={() => submit("What's the weather in NYC?")}>Ask</button>
 *       {object && <p>{object.temp}°F, {object.condition}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgentCCObject<T = unknown>(
  options: UseAgentCCObjectOptions<T>,
): UseAgentCCObjectReturn<T> {
  const client = useAgentCCClient();
  return useAgentCCObjectWithClient<T>(client, options);
}

export function useAgentCCObjectWithClient<T = unknown>(
  client: AgentCC,
  options: UseAgentCCObjectOptions<T>,
): UseAgentCCObjectReturn<T> {
  const { model, schema, schemaName, onError } = options;

  const [object, setObject] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (prompt: string) => {
      setIsLoading(true);
      setError(null);
      setObject(null);

      try {
        const response = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: schemaName ?? "response",
              strict: true,
              schema,
            },
          } as any,
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("No content in response");
        }

        const parsed = JSON.parse(content) as T;
        setObject(parsed);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        if (onError) onError(e);
      } finally {
        setIsLoading(false);
      }
    },
    [client, model, schema, schemaName, onError],
  );

  return { object, isLoading, error, submit };
}
