import type { BaseClient } from "../base-client.js";
import type { Completion, CompletionCreateParams } from "../types/completion.js";
import { parseAgentCCMetadata } from "../types/shared.js";
import { extractAgentCCParams } from "../agentcc-params.js";

export class Completions {
  constructor(private _client: BaseClient) {}

  async create(params: CompletionCreateParams): Promise<Completion> {
    const { headers, cleanBody } = extractAgentCCParams(params);
    const extraHeaders = params.extra_headers ?? {};
    const response = await (this._client as any).requestRaw({
      method: "POST",
      path: "/v1/completions",
      body: cleanBody,
      headers: { ...headers, ...extraHeaders },
    }) as Response;
    const data = (await response.json()) as Completion;
    data.agentcc = parseAgentCCMetadata(response.headers);
    return data;
  }
}
