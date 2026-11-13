import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createOpenAI } = vi.hoisted(() => ({ createOpenAI: vi.fn(() => vi.fn()) }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI }));
import { createAgentCC } from "../src/agentcc-provider.js";

const HTTP_WARNING =
  "AgentCC: non-loopback HTTP endpoints may require additional configuration. Review the endpoint configuration for your deployment.";
// The notice covers non-loopback HTTP endpoints only. Other schemes keep native validation.

// These are parser/diagnostic contracts, not network tests. No credentials or
// requests are sent. Every hostname outside loopback uses reserved test space.
describe("effective transport diagnostics", () => {
  beforeEach(() => {
    createOpenAI.mockClear();
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("location", undefined);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const absoluteCases: [string, string | null][] = [
    ["http://gateway.example.test/v1", HTTP_WARNING],
    ["HTTP://GATEWAY.EXAMPLE.TEST/v1", HTTP_WARNING],
    [" \tHTTP://gateway.example.test/v1\n", HTTP_WARNING],
    ["http:\\gateway.example.test\\v1", HTTP_WARNING],
    ["http:\\\\gateway.example.test\\v1", HTTP_WARNING],
    ["http://name:placeholder@gateway.example.test/v1", HTTP_WARNING],
    ["http://localhost@gateway.example.test/v1", HTTP_WARNING],
    ["http://localhost.example.test/v1", HTTP_WARNING],
    ["http://bücher.example/v1", HTTP_WARNING],
    ["http://xn--bcher-kva.example/v1", HTTP_WARNING],
    ["http://[2001:db8::1]/v1", HTTP_WARNING],
    ["http://[::ffff:127.0.0.1]/v1", HTTP_WARNING],
    ["http://192.0.2.1/v1", HTTP_WARNING],
    ["http://10.0.0.8/v1", HTTP_WARNING],
    ["https://gateway.example.test/v1", null],
    ["HTTPS://GATEWAY.EXAMPLE.TEST/v1", null],
    [" \tHTTPS://gateway.example.test/v1\n", null],
    ["https:\\\\gateway.example.test\\v1", null],
    ["https://name:placeholder@gateway.example.test/v1", null],
    ["https://bücher.example/v1", null],
    ["https://[2001:db8::1]/v1", null],
    ["http://localhost/v1", null],
    ["http://LOCALHOST./v1", null],
    ["http://service.localhost./v1", null],
    ["http://127.1/v1", null],
    ["http://127.255.255.255/v1", null],
    ["http://2130706433/v1", null],
    ["http://0x7f000001/v1", null],
    ["http://[::1]/v1", null],
    ["http://[0:0:0:0:0:0:0:1]/v1", null],
    ["data:text/plain,example", null],
    ["blob:https://gateway.example.test/example", null],
    ["blob:http://localhost/example", null],
    ["file:///tmp/example", null],
    ["file://localhost/tmp/example", null],
    ["ftp://gateway.example.test/v1", null],
    ["ftp://localhost/v1", null],
    ["ws://gateway.example.test/v1", null],
  ];
  it.each(absoluteCases)("classifies an absolute URL without browser globals: %s", (baseURL, warning) => {
    createAgentCC({ baseURL });
    expect(vi.mocked(console.warn).mock.calls).toEqual(warning ? [[warning]] : []);
    expect(createOpenAI.mock.calls[0][0].baseURL).toBe(baseURL);
  });

  const relativeCases = [
    ["//gateway.example.test/v1", false],
    ["///gateway.example.test/v1", false],
    ["\\\\gateway.example.test\\v1", false],
    ["/\\gateway.example.test/v1", false],
    ["\\/gateway.example.test/v1", false],
    [" \t//GATEWAY.EXAMPLE.TEST/v1\n", false],
    ["//name:placeholder@gateway.example.test/v1", false],
    ["//localhost@gateway.example.test/v1", false],
    ["//bücher.example/v1", false],
    ["/\t/gateway.example.test/v1", false],
    ["/\n\\gateway.example.test/v1", false],
    ["//[2001:db8::1]/v1", false],
    ["//LOCALHOST./v1", true],
    ["//service.localhost./v1", true],
    ["//127.1/v1", true],
    ["//[::1]/v1", true],
  ] as const;
  for (const protocol of ["http", "https"] as const) {
    it.each(relativeCases)(`resolves a network reference from ${protocol} without dispatch: %s`, (baseURL, local) => {
      vi.stubGlobal("document", { baseURI: `${protocol}://page.example.test/app/` });
      createAgentCC({ baseURL });
      expect(vi.mocked(console.warn).mock.calls).toEqual(protocol === "http" && !local ? [[HTTP_WARNING]] : []);
      expect(createOpenAI.mock.calls[0][0].baseURL).toBe(baseURL);
    });
  }

  const relativePaths = ["/v1", "/api/gateway", "api/gateway", "./api/gateway", "../api/gateway", "\\api\\gateway"];
  const pageCases: [string, string[][]][] = [
    ["http://page.example.test/app/", [[HTTP_WARNING]]],
    ["https://page.example.test/app/", []],
    ["http://localhost/app/", []],
    ["http://127.0.0.1/app/", []],
    ["http://[::1]/app/", []],
  ];
  for (const [page, expected] of pageCases) {
    it.each(relativePaths)(`resolves a path using ${page}: %s`, (baseURL) => {
      vi.stubGlobal("document", { baseURI: page });
      createAgentCC({ baseURL });
      expect(vi.mocked(console.warn).mock.calls).toEqual(expected);
    });
  }

  it.each(pageCases)("resolves a path using the worker location %s", (href, expected) => {
    vi.stubGlobal("location", { href });
    createAgentCC({ baseURL: "/v1" });
    expect(vi.mocked(console.warn).mock.calls).toEqual(expected);
  });

  it.each(["/api/gateway", "//gateway.example.test/v1", "http://[", "http:"])(
    "does not invent an effective target in Node: %s", (baseURL) => {
      createAgentCC({ baseURL });
      expect(console.warn).not.toHaveBeenCalled();
    },
  );

  it("uses document base URI before location, including a cross-origin base element", () => {
    vi.stubGlobal("location", { href: "https://page.example.test/app/" });
    vi.stubGlobal("document", { baseURI: "http://proxy.example.test/app/" });
    createAgentCC({ baseURL: "//gateway.example.test/v1" });
    expect(vi.mocked(console.warn).mock.calls).toEqual([[HTTP_WARNING]]);
  });

  it("uses the worker location when there is no document", () => {
    vi.stubGlobal("location", { href: "http://worker.example.test/worker.js" });
    createAgentCC({ baseURL: "//gateway.example.test/v1" });
    expect(vi.mocked(console.warn).mock.calls).toEqual([[HTTP_WARNING]]);
  });

  it.each([
    ["http://page.example.test/", [[HTTP_WARNING]]],
    ["https://page.example.test/", []],
  ])("resolves relative environment proxy settings against %s", (baseURI, expected) => {
    vi.stubEnv("AGENTCC_GATEWAY_URL", "/api/gateway");
    vi.stubGlobal("document", { baseURI });
    try {
      createAgentCC();
      expect(vi.mocked(console.warn).mock.calls).toEqual(expected);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("inspects the actual request after downstream path joining, without changing fetch arguments", async () => {
    const response = new Response("example");
    const fetch = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetch);
    createAgentCC({ baseURL: "http:" });
    const options = createOpenAI.mock.calls[0][0];
    expect(options.fetch).toBeTypeOf("function");
    // A request-shaped URL can be resolvable when the base by itself is not.
    const input = "http:/chat/completions";
    const init = { method: "POST", body: "{}" };
    expect(await options.fetch(input, init)).toBe(response);
    expect(fetch).toHaveBeenCalledWith(input, init);
    expect(vi.mocked(console.warn).mock.calls).toEqual([[HTTP_WARNING]]);
  });

  it("checks the current base URI at dispatch and warns at most once per provider", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("example"));
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("document", { baseURI: "https://page.example.test/" });
    createAgentCC({ baseURL: "//gateway.example.test/v1" });
    const options = createOpenAI.mock.calls[0][0];
    expect(options.fetch).toBeTypeOf("function");
    expect(console.warn).not.toHaveBeenCalled();
    vi.stubGlobal("document", { baseURI: "http://page.example.test/" });
    await options.fetch("//gateway.example.test/v1/chat/completions", {});
    await options.fetch("//gateway.example.test/v1/embeddings", {});
    expect(vi.mocked(console.warn).mock.calls).toEqual([[HTTP_WARNING]]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("checks relative proxy dispatch against the current base URI and warns once", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("example"));
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("document", { baseURI: "https://page.example.test/" });
    createAgentCC({ baseURL: "/api/gateway" });
    const options = createOpenAI.mock.calls[0][0];
    vi.stubGlobal("document", { baseURI: "http://page.example.test/" });
    await options.fetch("/api/gateway/chat/completions", {});
    await options.fetch("/api/gateway/embeddings", {});
    expect(vi.mocked(console.warn).mock.calls).toEqual([[HTTP_WARNING]]);
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/gateway/chat/completions", {});
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/gateway/embeddings", {});
  });

  it.each(["string", "URL", "Request"])("passes through %s inputs with no duplicate constructor warning", async (kind) => {
    const fetch = vi.fn().mockResolvedValue(new Response("example"));
    vi.stubGlobal("fetch", fetch);
    createAgentCC({ baseURL: "http://gateway.example.test/v1" });
    const options = createOpenAI.mock.calls[0][0];
    expect(options.fetch).toBeTypeOf("function");
    const url = "http://gateway.example.test/v1/chat/completions";
    const input = kind === "URL" ? new URL(url) : kind === "Request" ? new Request(url) : url;
    await options.fetch(input, undefined);
    expect(fetch).toHaveBeenCalledWith(input, undefined);
    expect(vi.mocked(console.warn).mock.calls).toEqual([[HTTP_WARNING]]);
  });

  it("keeps warning state local to each provider", () => {
    createAgentCC({ baseURL: "http://gateway.example.test/v1" });
    createAgentCC({ baseURL: "http://gateway.example.test/v1" });
    expect(vi.mocked(console.warn).mock.calls).toEqual([[HTTP_WARNING], [HTTP_WARNING]]);
  });

  it("preserves fetch rejection identity", async () => {
    const error = new TypeError("synthetic transport failure");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
    createAgentCC({ baseURL: "https://gateway.example.test/v1" });
    const options = createOpenAI.mock.calls[0][0];
    expect(options.fetch).toBeTypeOf("function");
    await expect(options.fetch("https://gateway.example.test/v1/chat/completions", {})).rejects.toBe(error);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("does not include URL components in a diagnostic", () => {
    vi.stubGlobal("document", { baseURI: "http://page.example.test/" });
    createAgentCC({ baseURL: "//name:placeholder@gateway.example.test/private?note=sample#fragment" });
    expect(vi.mocked(console.warn).mock.calls).toEqual([[HTTP_WARNING]]);
  });

  it("does not turn console failures into request failures", async () => {
    vi.mocked(console.warn).mockImplementation(() => { throw new Error("synthetic sink failure"); });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("example")));
    createAgentCC({ baseURL: "https://gateway.example.test/v1" });
    const options = createOpenAI.mock.calls[0][0];
    expect(options.fetch).toBeTypeOf("function");
    await expect(options.fetch("http://gateway.example.test/v1/chat/completions", {})).resolves.toBeInstanceOf(Response);
    expect(console.warn).toHaveBeenCalledOnce();
  });
});
