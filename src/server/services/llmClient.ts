import { env } from "../env.js";
import { AppError } from "../errors.js";

/** Provider settings as resolved from user settings or LLM_* env vars. */
export interface LlmCallConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string | null;
  customHeaders: Record<string, string>;
}

export interface LlmToolCall { id: string; name: string; arguments: string }

// Every supported provider exposes an OpenAI-compatible Chat Completions API at these bases.
const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
  xai: "https://api.x.ai/v1",
  groq: "https://api.groq.com/openai/v1",
  zai: "https://api.z.ai/api/paas/v4",
  ollama: "http://localhost:11434/v1"
};

export function resolveChatCompletionsRequest(config: LlmCallConfig) {
  const base = config.baseUrl?.trim() || DEFAULT_BASE_URLS[config.provider];
  if (!base) {
    throw new AppError(400, `Provider "${config.provider}" needs an OpenAI-compatible API base URL.`);
  }
  const trimmed = base.replace(/\/+$/, "");
  const url = trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
  // Mirror LiteLLM: "openai/gpt-4o-mini" with provider openai is sent as "gpt-4o-mini"; gateway names like "ag/x" pass through.
  const prefix = `${config.provider}/`;
  const model = config.model.toLowerCase().startsWith(prefix) ? config.model.slice(prefix.length) : config.model;
  const headers: Record<string, string> = { ...config.customHeaders, "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  return { url, model, headers };
}

async function post(config: LlmCallConfig, body: Record<string, unknown>, signal?: AbortSignal) {
  const { url, model, headers } = resolveChatCompletionsRequest(config);
  const timeout = AbortSignal.timeout(env.LLM_TIMEOUT_MS);
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, model }),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = text;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: unknown } | string };
      message = String(typeof parsed.error === "string" ? parsed.error : parsed.error?.message ?? text);
    } catch {
      // Non-JSON error body; use it as-is.
    }
    throw new AppError(502, `LLM provider returned HTTP ${response.status}${message ? `: ${message.slice(0, 300)}` : ""}`);
  }
  return response;
}

/** One-shot completion; returns the assistant text. */
export async function completeChat(config: LlmCallConfig, messages: unknown[]) {
  const response = await post(config, { messages, stream: false });
  const result = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: unknown } }> } | null;
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new AppError(502, "LLM provider returned an empty response.");
  }
  return content.trim();
}

/** Streams a completion, forwarding text deltas and returning accumulated tool calls. */
export async function streamChat(
  config: LlmCallConfig,
  messages: unknown[],
  tools: unknown[],
  signal: AbortSignal,
  onText: (delta: string) => void
) {
  const response = await post(config, { messages, tools: tools.length ? tools : undefined, stream: true }, signal);
  if (!response.body) throw new AppError(502, "LLM provider returned no stream.");
  const calls = new Map<number, LlmToolCall>();
  let text = "";
  let buffer = "";
  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let end: number;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      let event: { choices?: Array<{ delta?: { content?: string | null; tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }> } }>; error?: { message?: string } };
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }
      if (event.error) throw new AppError(502, `LLM provider error: ${String(event.error.message ?? "unknown").slice(0, 300)}`);
      const delta = event.choices?.[0]?.delta;
      if (delta?.content) {
        text += delta.content;
        onText(delta.content);
      }
      for (const toolCall of delta?.tool_calls ?? []) {
        const index = toolCall.index ?? 0;
        const slot = calls.get(index) ?? { id: "", name: "", arguments: "" };
        if (toolCall.id) slot.id = toolCall.id;
        // Some providers repeat the name on every chunk; take the first.
        if (toolCall.function?.name && !slot.name) slot.name = toolCall.function.name;
        slot.arguments += toolCall.function?.arguments ?? "";
        calls.set(index, slot);
      }
    }
  }
  return { text, toolCalls: [...calls.entries()].sort(([a], [b]) => a - b).map(([, call]) => call) };
}
