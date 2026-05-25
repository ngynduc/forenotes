import type { ReportContext } from "../../shared/reportTypes.js";
import type { ReportType } from "../../shared/domain.js";

export const LITELLM_SYSTEM_PROMPT = [
  "You are assisting with DFIR report writing.",
  "Generate a professional Markdown report using only the provided incident context.",
  "Do not invent facts.",
  "If data is missing, write \"Not provided\" or omit the section.",
  "Return Markdown only.",
  "Do not wrap the response in JSON.",
  "Do not include HTML.",
  "For each section, if the context contains relevant information, summarize it in a clear and concise manner.",
].join(" ");

export interface LiteLlmServiceConfig {
  serviceUrl: string;
  provider: string;
  model: string;
  systemPrompt: string;
  apiKey: string;
  apiBase: string | null;
  customHeaders: Record<string, string>;
}

export interface LiteLlmGenerateReportPayload {
  provider: string;
  model: string;
  systemPrompt?: string;
  apiKey?: string;
  apiBase?: string;
  customHeaders: Record<string, string>;
  reportType: ReportType;
  templateMarkdown: string;
  incidentContext: ReportContext;
}

export function resolveLiteLlmServiceUrl(rawUrl = process.env.LITELLM_SERVICE_URL) {
  return (rawUrl?.trim() || "http://localhost:8001").replace(/\/+$/, "");
}

export function buildLiteLlmGenerateReportPayload(
  config: LiteLlmServiceConfig,
  reportType: ReportType,
  templateMarkdown: string,
  incidentContext: ReportContext
): LiteLlmGenerateReportPayload {
  return {
    provider: config.provider,
    model: config.model,
    systemPrompt: config.systemPrompt || undefined,
    apiKey: config.apiKey || undefined,
    apiBase: config.apiBase || undefined,
    customHeaders: config.customHeaders,
    reportType,
    templateMarkdown,
    incidentContext
  };
}

export async function callLiteLlmGenerateReportService(serviceUrl: string, payload: LiteLlmGenerateReportPayload) {
  const response = await fetch(`${serviceUrl}/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`LiteLLM service returned HTTP ${response.status}`);
  }

  const result = await response.json().catch(() => null) as { ok?: boolean; markdown?: unknown; error?: unknown } | null;
  if (!result?.ok || typeof result.markdown !== "string" || !result.markdown.trim()) {
    throw new Error("LiteLLM service did not return Markdown.");
  }

  return result.markdown.trim();
}
