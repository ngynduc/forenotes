import type { ReportType } from "./domain.js";

export type ReportGenerationMode = "deterministic" | "llm";

export interface ReportTemplate {
  id: string;
  incidentId: string;
  name: string;
  reportType: ReportType;
  content: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentReport {
  id: string;
  incidentId: string;
  templateId?: string | null;
  title: string;
  reportType: ReportType;
  reportDate?: string | null;
  timezone?: string | null;
  markdown: string;
  generationMode: ReportGenerationMode;
  generatedContext: ReportContext;
  unresolvedPlaceholders: string[];
  createdByUserId: string;
  updatedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportExport {
  id: string;
  reportId: string;
  incidentId: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

export interface PdfTemplate {
  id: string;
  name: string;
  description?: string | null;
  scope: "global" | "incident";
  incidentId?: string | null;
  htmlTemplate: string;
  css: string;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaskedCustomHeader {
  name: string;
  configured: boolean;
}

export interface LlmSettingsStatus {
  configured: boolean;
  source: "user" | "env" | null;
  provider: string;
  model: string;
  endpointConfigured: boolean;
  apiKeyConfigured: boolean;
  customHeadersConfigured: boolean;
  customHeaders: MaskedCustomHeader[];
}

export type MaskedLlmSettings = LlmSettingsStatus;

export interface ReportContext {
  generatedAt: string;
  reportType: ReportType;
  date?: string;
  timezone?: string;
  window?: {
    start: string;
    end: string;
  };
  incident: Record<string, unknown>;
  findings: Record<string, unknown>[];
  timelineEvents: Record<string, unknown>[];
  tasks: Array<Record<string, unknown> & { note?: string }>;
  queries: Record<string, unknown>[];
  indicators: Record<string, unknown>[];
  systems: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
  members: Record<string, unknown>[];
  entityLinks: Record<string, unknown>[];
  tags: {
    custom: Record<string, unknown>[];
    attack: Record<string, unknown>[];
  };
  activity?: Record<string, unknown>;
}
