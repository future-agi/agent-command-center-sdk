// ---------------------------------------------------------------------------
// Shared types for agentcc-react hooks
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  id?: string;
}

export interface UseAgentCCChatOptions {
  /** Model to use (e.g. "gpt-4o"). */
  model: string;
  /** Initial messages to seed the conversation. */
  initialMessages?: ChatMessage[];
  /** Called when an error occurs. */
  onError?: (error: Error) => void;
  /** Called when a response finishes. */
  onFinish?: (message: ChatMessage) => void;
  /** Additional body params for every request. */
  body?: Record<string, unknown>;
}

export interface UseAgentCCChatReturn {
  /** The current conversation messages. */
  messages: ChatMessage[];
  /** The current input value. */
  input: string;
  /** Set the input value. */
  setInput: (value: string) => void;
  /** Submit the current input as a user message. */
  handleSubmit: (e?: { preventDefault?: () => void }) => void;
  /** Whether a response is currently streaming. */
  isLoading: boolean;
  /** The last error, if any. */
  error: Error | null;
  /** Stop the current streaming response. */
  stop: () => void;
  /** Reload (re-send) the last user message. */
  reload: () => void;
  /** Directly append a message. */
  append: (message: ChatMessage) => void;
  /** Replace all messages. */
  setMessages: (messages: ChatMessage[]) => void;
}

export interface UseAgentCCCompletionOptions {
  /** Model to use. */
  model: string;
  /** Initial prompt. */
  prompt?: string;
  /** Called when an error occurs. */
  onError?: (error: Error) => void;
}

export interface UseAgentCCCompletionReturn {
  /** The completion text. */
  completion: string;
  /** Whether a request is in progress. */
  isLoading: boolean;
  /** The last error, if any. */
  error: Error | null;
  /** Send a prompt and get a completion. */
  complete: (prompt: string) => Promise<void>;
}

export interface UseAgentCCObjectOptions<T> {
  /** Model to use. */
  model: string;
  /** JSON Schema for structured output. */
  schema: Record<string, unknown>;
  /** Schema name for the response_format. */
  schemaName?: string;
  /** Called when an error occurs. */
  onError?: (error: Error) => void;
}

export interface UseAgentCCObjectReturn<T> {
  /** The parsed object (null until a successful response). */
  object: T | null;
  /** Whether a request is in progress. */
  isLoading: boolean;
  /** The last error, if any. */
  error: Error | null;
  /** Submit a prompt and get a structured object. */
  submit: (prompt: string) => Promise<void>;
}
