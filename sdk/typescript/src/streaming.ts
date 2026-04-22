import { StreamError } from "./errors.js";
import type { ChatCompletionChunk } from "./types/chat/chat-completion-chunk.js";
import type { ChatCompletion, ChatCompletionMessage } from "./types/chat/chat-completion.js";
import type { AgentCCMetadata } from "./types/shared.js";
import { parseAgentCCMetadata } from "./types/shared.js";
import type { StreamEvent } from "./stream-events.js";

// ---------------------------------------------------------------------------
// SSE parser
// ---------------------------------------------------------------------------

interface SSEEvent {
  data: string | null;
  event: string | null;
  id: string | null;
  retry: number | null;
}

/**
 * Parse an SSE byte stream into individual events.
 * Works with any `ReadableStream<Uint8Array>`.
 */
export async function* parseSSE(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split on double newline (SSE event boundary)
      const parts = buffer.split("\n\n");
      // Keep the last partial part in the buffer
      buffer = parts.pop()!;

      for (const part of parts) {
        const event = parseSSEBlock(part);
        if (event) yield event;
      }
    }

    // Handle any remaining data
    if (buffer.trim()) {
      const event = parseSSEBlock(buffer);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSSEBlock(block: string): SSEEvent | null {
  let data: string | null = null;
  let event: string | null = null;
  let id: string | null = null;
  let retry: number | null = null;

  for (const line of block.split("\n")) {
    if (line.startsWith(":")) continue; // comment
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const field = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1).trimStart();

    switch (field) {
      case "data":
        data = data ? data + "\n" + value : value;
        break;
      case "event":
        event = value;
        break;
      case "id":
        id = value;
        break;
      case "retry":
        retry = parseInt(value, 10) || null;
        break;
    }
  }

  if (data === null && event === null) return null;
  return { data, event, id, retry };
}

// ---------------------------------------------------------------------------
// Stream class — async iterable over ChatCompletionChunk
// ---------------------------------------------------------------------------

export class Stream implements AsyncIterable<ChatCompletionChunk> {
  private _response: Response;
  private _agentcc: AgentCCMetadata;
  private _done = false;

  constructor(response: Response) {
    this._response = response;
    this._agentcc = parseAgentCCMetadata(response.headers);
  }

  /** Gateway metadata parsed from response headers. */
  get agentcc(): AgentCCMetadata {
    return this._agentcc;
  }

  /** The raw fetch Response. */
  get response(): Response {
    return this._response;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<ChatCompletionChunk> {
    if (this._done) throw new StreamError("Stream already consumed");
    this._done = true;

    const body = this._response.body;
    if (!body) throw new StreamError("Response body is null");

    // If content-type is JSON (e.g. cache hit), emit a single synthetic chunk
    const ct = this._response.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = (await this._response.json()) as ChatCompletionChunk;
      json.agentcc = this._agentcc;
      yield json;
      return;
    }

    for await (const event of parseSSE(body)) {
      if (!event.data) continue;
      if (event.data === "[DONE]") return;

      try {
        const chunk: ChatCompletionChunk = JSON.parse(event.data);
        chunk.agentcc = this._agentcc;
        yield chunk;
      } catch {
        throw new StreamError(`Failed to parse SSE data: ${event.data}`);
      }
    }
  }

  /** Cancel the stream early. */
  abort(): void {
    this._response.body?.cancel().catch(() => {});
    this._done = true;
  }
}

// ---------------------------------------------------------------------------
// ChunkAccumulator — reassemble a ChatCompletion from chunks
// ---------------------------------------------------------------------------

export class ChunkAccumulator {
  private _chunks: ChatCompletionChunk[] = [];
  private _textParts: string[] = [];
  private _id = "";
  private _model = "";
  private _created = 0;

  add(chunk: ChatCompletionChunk): void {
    this._chunks.push(chunk);
    if (!this._id && chunk.id) this._id = chunk.id;
    if (!this._model && chunk.model) this._model = chunk.model;
    if (!this._created && chunk.created) this._created = chunk.created;

    for (const choice of chunk.choices) {
      if (choice.delta?.content) {
        this._textParts.push(choice.delta.content);
      }
    }
  }

  /** Get the accumulated text content. */
  getText(): string {
    return this._textParts.join("");
  }

  /** Reassemble a full ChatCompletion from all accumulated chunks. */
  getFinalCompletion(): ChatCompletion {
    const lastChunk = this._chunks[this._chunks.length - 1];
    const finishReason =
      lastChunk?.choices?.[0]?.finish_reason ?? "stop";

    const message: ChatCompletionMessage = {
      role: "assistant",
      content: this.getText() || null,
    };

    // Collect tool calls
    const toolCallMap = new Map<number, { id: string; type: "function"; function: { name: string; arguments: string } }>();
    for (const chunk of this._chunks) {
      for (const choice of chunk.choices) {
        if (choice.delta?.tool_calls) {
          for (const tc of choice.delta.tool_calls) {
            if (!toolCallMap.has(tc.index)) {
              toolCallMap.set(tc.index, {
                id: tc.id || "",
                type: "function",
                function: { name: "", arguments: "" },
              });
            }
            const acc = toolCallMap.get(tc.index)!;
            if (tc.id) acc.id = tc.id;
            if (tc.function?.name) acc.function.name += tc.function.name;
            if (tc.function?.arguments) acc.function.arguments += tc.function.arguments;
          }
        }
      }
    }
    if (toolCallMap.size > 0) {
      message.tool_calls = [...toolCallMap.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, tc]) => tc);
    }

    return {
      id: this._id,
      object: "chat.completion",
      created: this._created,
      model: this._model,
      choices: [{ index: 0, message, finish_reason: finishReason }],
      usage: lastChunk?.usage,
      agentcc: lastChunk?.agentcc,
    };
  }
}

// ---------------------------------------------------------------------------
// StreamManager — convenience wrapper with text_stream + final completion
// ---------------------------------------------------------------------------

export class StreamManager implements AsyncIterable<ChatCompletionChunk> {
  private _stream: Stream;
  private _accumulator = new ChunkAccumulator();
  private _consumed = false;

  constructor(stream: Stream) {
    this._stream = stream;
  }

  get agentcc(): AgentCCMetadata {
    return this._stream.agentcc;
  }

  /** Iterate over raw chunks. */
  async *[Symbol.asyncIterator](): AsyncGenerator<ChatCompletionChunk> {
    if (this._consumed) throw new StreamError("StreamManager already consumed");
    this._consumed = true;

    for await (const chunk of this._stream) {
      this._accumulator.add(chunk);
      yield chunk;
    }
  }

  /** Iterate over just the text content deltas. */
  async *textStream(): AsyncGenerator<string> {
    for await (const chunk of this) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) yield content;
    }
  }

  /** Get the final reassembled ChatCompletion. Must consume the stream first. */
  getFinalCompletion(): ChatCompletion {
    return this._accumulator.getFinalCompletion();
  }

  /** Get the final text. Must consume the stream first. */
  getFinalText(): string {
    return this._accumulator.getText();
  }

  /** Iterate over typed StreamEvent objects. */
  async *events(): AsyncGenerator<StreamEvent> {
    for await (const chunk of this) {
      // Content deltas
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield { type: "content", text: content };
      }

      // Tool call deltas
      const toolCalls = chunk.choices?.[0]?.delta?.tool_calls;
      if (toolCalls) {
        for (const tc of toolCalls) {
          yield {
            type: "tool_call",
            index: tc.index,
            id: tc.id,
            name: tc.function?.name,
            arguments: tc.function?.arguments,
          };
        }
      }

      // Usage
      if (chunk.usage) {
        yield { type: "usage", usage: chunk.usage };
      }

      // Done
      const finishReason = chunk.choices?.[0]?.finish_reason;
      if (finishReason === "stop" || finishReason === "tool_calls") {
        yield { type: "done", completion: this._accumulator.getFinalCompletion() };
      }
    }
  }

  /** Cancel the stream early. */
  abort(): void {
    this._stream.abort();
  }
}
