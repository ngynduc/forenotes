import type { ReportContext } from "../../shared/reportTypes.js";
import type { ReportType } from "../../shared/domain.js";

export const REPORT_LLM_SYSTEM_PROMPT = [
  "You are assisting with DFIR report writing.",
  "Generate a professional Markdown report using only the provided incident context.",
  "Do not invent facts.",
  "If data is missing, write \"Not provided\" or omit the section.",
  "Return Markdown only.",
  "Do not wrap the response in JSON.",
  "Do not include HTML."
].join(" ");

export interface LlmProviderConfig {
  serviceUrl: string;
  provider: string;
  model: string;
  apiKey: string;
  apiBase: string | null;
  customHeaders: Record<string, string>;
}

export interface GenerateReportPayload {
  provider: string;
  model: string;
  apiKey?: string;
  apiBase?: string;
  customHeaders: Record<string, string>;
  reportType: ReportType;
  templateMarkdown: string;
  incidentContext: ReportContext;
}

export class ReportGenerationServiceError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function resolveReportGenerationServiceUrl(rawUrl = process.env.REPORT_LLM_SERVICE_URL) {
  return (rawUrl?.trim() || "http://localhost:8001").replace(/\/+$/, "");
}

export function buildGenerateReportPayload(
  config: LlmProviderConfig,
  reportType: ReportType,
  templateMarkdown: string,
  incidentContext: ReportContext
): GenerateReportPayload {
  return {
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey || undefined,
    apiBase: config.apiBase || undefined,
    customHeaders: config.customHeaders,
    reportType,
    templateMarkdown,
    incidentContext
  };
}

function detailFromServiceResponse(result: unknown) {
  if (result && typeof result === "object") {
    const detail = (result as { detail?: unknown; error?: unknown }).detail ?? (result as { error?: unknown }).error;
    if (typeof detail === "string" && detail.trim()) {
      return detail.trim();
    }
  }
  return null;
}

export async function callReportGenerationService(serviceUrl: string, payload: GenerateReportPayload) {
  const response = await fetch(`${serviceUrl}/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => null) as { ok?: boolean; markdown?: unknown; error?: unknown; detail?: unknown } | null;
  if (!response.ok) {
    const detail = detailFromServiceResponse(result);
    throw new ReportGenerationServiceError(
      response.status,
      detail ? `Report LLM service returned HTTP ${response.status}: ${detail}` : `Report LLM service returned HTTP ${response.status}`,
      detail
    );
  }

  if (!result?.ok || typeof result.markdown !== "string" || !result.markdown.trim()) {
    throw new ReportGenerationServiceError(502, detailFromServiceResponse(result) ?? "Report LLM service did not return Markdown.");
  }

  return result.markdown.trim();
}
