// ---------------------------------------------------------------------------
// useAgentCCChat — Streaming chat hook
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef } from "react";
import type { AgentCC } from "@agentcc/client";
import { useAgentCCClient } from "./provider.js";
import type {
  ChatMessage,
  UseAgentCCChatOptions,
  UseAgentCCChatReturn,
} from "./types.js";

let _idCounter = 0;
function generateId(): string {
  return `msg-${Date.now()}-${++_idCounter}`;
}

/**
 * React hook for streaming chat completions via AgentCC.
 *
 * Manages conversation state, streams responses token-by-token,
 * and supports stop/reload.
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const { messages, input, setInput, handleSubmit, isLoading } = useAgentCCChat({
 *     model: "gpt-4o",
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map((m) => <div key={m.id}>{m.role}: {m.content}</div>)}
 *       <form onSubmit={handleSubmit}>
 *         <input value={input} onChange={(e) => setInput(e.target.value)} />
 *         <button type="submit" disabled={isLoading}>Send</button>
 *       </form>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgentCCChat(options: UseAgentCCChatOptions): UseAgentCCChatReturn {
  const client = useAgentCCClient();
  return useAgentCCChatWithClient(client, options);
}

/**
 * Internal implementation that accepts an explicit client.
 * Exported for testing without needing React context.
 */
export function useAgentCCChatWithClient(
  client: AgentCC,
  options: UseAgentCCChatOptions,
): UseAgentCCChatReturn {
  const { model, initialMessages = [], onError, onFinish, body } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessages = useCallback(
    async (msgs: ChatMessage[]) => {
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
      };

      // Optimistically add empty assistant message
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const stream = await client.chat.completions.stream({
          model,
          messages: msgs.map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          })),
          ...body,
        });

        for await (const chunk of stream) {
          if (controller.signal.aborted) break;
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            assistantMsg.content += delta.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...assistantMsg };
              return updated;
            });
          }
        }

        if (onFinish) onFinish(assistantMsg);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) onError(error);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [client, model, body, onError, onFinish],
  );

  const handleSubmit = useCallback(
    (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.();
      if (!input.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: input.trim(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      sendMessages(newMessages);
    },
    [input, isLoading, messages, sendMessages],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const reload = useCallback(() => {
    // Find the last user message and re-send up to that point
    const lastUserIdx = messages.findLastIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;

    const msgsUpToUser = messages.slice(0, lastUserIdx + 1);
    setMessages(msgsUpToUser);
    sendMessages(msgsUpToUser);
  }, [messages, sendMessages]);

  const append = useCallback(
    (message: ChatMessage) => {
      const msg = { ...message, id: message.id ?? generateId() };
      const newMessages = [...messages, msg];
      setMessages(newMessages);
      if (msg.role === "user") {
        sendMessages(newMessages);
      }
    },
    [messages, sendMessages],
  );

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
    append,
    setMessages,
  };
}
