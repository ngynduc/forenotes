import { afterEach, describe, expect, it, vi } from "vitest";
import { streamChat } from "../services/llmClient.js";

const config = { provider: "openai-compatible", model: "m", apiKey: "k", baseUrl: "https://gw.test/v1", customHeaders: {} };

function sse(lines: string[]) {
  const body = lines.map((line) => `data: ${line}\n\n`).join("");
  // Split mid-event to prove the parser buffers partial chunks.
  const chunks = [body.slice(0, 37), body.slice(37)];
  return new Response(new ReadableStream({ start(controller) { chunks.forEach((chunk) => controller.enqueue(new TextEncoder().encode(chunk))); controller.close(); } }), { status: 200 });
}

describe("streamChat", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("forwards text deltas and assembles streamed tool calls", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sse([
      JSON.stringify({ choices: [{ delta: { content: "Hel" } }] }),
      JSON.stringify({ choices: [{ delta: { content: "lo" } }] }),
      JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id: "c1", function: { name: "query_incident_data", arguments: "{\"enti" } }] } }] }),
      JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, function: { name: "query_incident_data", arguments: "ty\":\"findings\"}" } }] } }] }),
      "[DONE]"
    ])));
    const deltas: string[] = [];
    const result = await streamChat(config, [{ role: "user", content: "hi" }], [], new AbortController().signal, (delta) => deltas.push(delta));
    expect(deltas.join("")).toBe("Hello");
    expect(result).toEqual({ text: "Hello", toolCalls: [{ id: "c1", name: "query_incident_data", arguments: "{\"entity\":\"findings\"}" }] });
  });

  it("surfaces provider HTTP errors with their message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "model not found" } }), { status: 404 })));
    await expect(streamChat(config, [], [], new AbortController().signal, () => {})).rejects.toThrow(/HTTP 404: model not found/);
  });

  it("aborts a provider that never answers once LLM_TIMEOUT_MS elapses", async () => {
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    })));
    const controller = new AbortController();
    const pending = streamChat(config, [], [], controller.signal, () => {});
    controller.abort(new Error("stopped"));
    await expect(pending).rejects.toThrow(/stopped/);
  });
});
