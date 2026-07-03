import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import path from "node:path";
import type { LlmSettingsStatus, PdfTemplate, ReportContext, ReportGenerationMode } from "../../shared/reportTypes.js";
import type { ReportType } from "../../shared/domain.js";
import type { Database } from "../db/types.js";
import { env } from "../env.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { getDataDir, getUploadsDir } from "../storage.js";
import type { AuthenticatedUser } from "./authService.js";
import { createAuditLog } from "./auditLogService.js";
import {
  buildLiteLlmGenerateReportPayload,
  callLiteLlmGenerateReportService,
  resolveLiteLlmServiceUrl,
  type LiteLlmServiceConfig
} from "./litellmServiceClient.js";
import {
  DEFAULT_PDF_CSS,
  DEFAULT_PDF_HTML_TEMPLATE,
  renderHtmlToPdf,
  renderPdfHtml
} from "./reportPdfRenderer.js";

export {
  DEFAULT_PDF_CSS,
  DEFAULT_PDF_HTML_TEMPLATE,
  renderHtmlToPdf,
  renderMarkdownToSanitizedHtml,
  renderPdfHtml
} from "./reportPdfRenderer.js";
export { buildLiteLlmGenerateReportPayload } from "./litellmServiceClient.js";

interface CreateTemplateInput {
  name: string;
  reportType: ReportType;
  content: string;
}

interface UpdateTemplateInput {
  name?: string;
  reportType?: ReportType;
  content?: string;
}

interface GenerateReportInput {
  templateId: string;
  reportType: ReportType;
  date?: string;
  timezone?: string;
  useLlm?: boolean;
}

interface CreateReportInput {
  templateId?: string;
  title: string;
  reportType: ReportType;
  reportDate?: string | null;
  timezone?: string | null;
  markdown: string;
  generationMode: ReportGenerationMode;
  generatedContext: ReportContext;
  unresolvedPlaceholders?: string[];
}

interface CustomHeaderInput {
  name: string;
  value: string;
}

interface CreatePdfTemplateInput {
  name: string;
  description?: string;
  scope?: "global" | "incident";
  incidentId?: string | null;
  htmlTemplate: string;
  css?: string;
  isDefault?: boolean;
}

interface UpdatePdfTemplateInput {
  name?: string;
  description?: string;
  scope?: "global" | "incident";
  incidentId?: string | null;
  htmlTemplate?: string;
  css?: string;
  isDefault?: boolean;
}

interface UploadReportImageInput {
  data: Buffer;
  contentType: string;
  filename?: string;
}

type DbRow = Record<string, unknown>;

interface LlmProviderConfig {
  provider: string;
  baseUrl: string | null;
  serviceUrl: string;
  model: string;
  systemPrompt: string;
  apiKey: string;
  apiKeyDecryptionFailed?: boolean;
  customHeaders: Record<string, string>;
  source: "user" | "env";
  endpointConfigured: boolean;
  apiKeyMask?: string | null;
  updatedAt?: unknown;
}

const CANONICAL_LLM_PROVIDERS = new Set([
  "anthropic",
  "gemini",
  "groq",
  "ollama",
  "openai",
  "openrouter",
  "xai",
  "zai"
]);
const CUSTOM_ENDPOINT_PROVIDERS = new Set([
  "custom",
  "openai-compatible",

  // local / self-hosted / custom endpoint providers
  "ollama",
  "vllm",
  "lmstudio",
  "tgi", // HuggingFace Text Generation Inference
  "litellm",
  "azure-openai",
  "deepseek",

  // OpenAI-compatible routers / gateways
  "together",
  "fireworks",
  "deepinfra",
  "anyscale",
  "perplexity",
  "mistral",
  "cerebras",
  "nano-gpt"
]);
const ALLOWED_LLM_PROVIDERS = new Set([...CANONICAL_LLM_PROVIDERS, ...CUSTOM_ENDPOINT_PROVIDERS]);
const BLOCKED_CUSTOM_HEADERS = new Set([
  "authorization",
  "cookie",
  "host",
  "proxy-authorization",
  "x-api-key",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-real-ip"
]);
const MAX_REPORT_IMAGE_BYTES = 10 * 1024 * 1024;
const REPORT_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const REPORT_IMAGE_CONTENT_TYPES = Object.keys(REPORT_IMAGE_EXTENSIONS);

function providerFromModel(model: string) {
  const cleanModel = model.trim().toLowerCase();
  const [prefix] = cleanModel.split("/", 1);
  return prefix && CANONICAL_LLM_PROVIDERS.has(prefix) ? prefix : null;
}

function normalizeLlmProvider(rawProvider: string | null | undefined, model: string) {
  const cleanProvider = rawProvider?.trim().toLowerCase();
  if (!cleanProvider || cleanProvider === "litellm" || cleanProvider === "model-prefixed") {
    return providerFromModel(model) ?? "openai";
  }
  if (cleanProvider === "google" || cleanProvider === "google-ai-studio") {
    return "gemini";
  }
  if (cleanProvider === "z-ai" || cleanProvider === "z.ai") {
    return "zai";
  }
  return cleanProvider;
}

export async function listReportTemplates(database: Database, user: AuthenticatedUser, incidentId: string) {
  await requirePermission(database, user, "report:read");
  await requireIncidentMembership(database, user.id, incidentId);
  const result = await database.query(
    "select * from report_templates where incident_id = $1 order by updated_at desc",
    [incidentId]
  );
  return result.rows;
}

export async function createReportTemplate(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  input: CreateTemplateInput
) {
  await requirePermission(database, user, "report_template:create");
  await requireIncidentMembership(database, user.id, incidentId);

  const templateId = randomUUID();
  await database.query(
    `
      insert into report_templates (id, incident_id, name, report_type, content, created_by_user_id)
      values ($1, $2, $3, $4, $5, $6)
    `,
    [templateId, incidentId, input.name, input.reportType, input.content, user.id]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "report_template.create",
    entityType: "report_template",
    entityId: templateId,
    afterJson: input
  });

  return getTemplate(database, incidentId, templateId);
}

export async function updateReportTemplate(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  templateId: string,
  input: UpdateTemplateInput
) {
  await requirePermission(database, user, "report_template:update");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await getTemplate(database, incidentId, templateId);
  const next = {
    name: input.name ?? existing.name,
    report_type: input.reportType ?? existing.report_type,
    content: input.content ?? existing.content
  };

  await database.query(
    `
      update report_templates
      set name = $3, report_type = $4, content = $5, updated_at = now()
      where id = $1 and incident_id = $2
    `,
    [templateId, incidentId, next.name, next.report_type, next.content]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "report_template.update",
    entityType: "report_template",
    entityId: templateId,
    beforeJson: existing,
    afterJson: next
  });

  return getTemplate(database, incidentId, templateId);
}

export async function deleteReportTemplate(database: Database, user: AuthenticatedUser, incidentId: string, templateId: string) {
  await requirePermission(database, user, "report_template:delete");
  await requireIncidentMembership(database, user.id, incidentId);
  const existing = await getTemplate(database, incidentId, templateId);
  await database.query("delete from report_templates where id = $1 and incident_id = $2", [templateId, incidentId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "report_template.delete",
    entityType: "report_template",
    entityId: templateId,
    beforeJson: existing
  });
}

export async function duplicateReportTemplate(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  templateId: string,
  name?: string
) {
  const existing = await getTemplate(database, incidentId, templateId);
  return createReportTemplate(database, user, incidentId, {
    name: name ?? `${String(existing.name)} copy`,
    reportType: existing.report_type as ReportType,
    content: String(existing.content)
  });
}

export async function buildReportContext(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  reportType: ReportType,
  options: { date?: string; timezone?: string } = {}
): Promise<ReportContext> {
  await requirePermission(database, user, "report:read");
  await requireIncidentMembership(database, user.id, incidentId);

  if (reportType === "daily" && (!options.date || !options.timezone)) {
    throw new AppError(400, "Daily report context requires date and timezone.");
  }

  const full = await buildFullIncidentContext(database, incidentId, reportType, options);
  if (reportType !== "daily") {
    return full;
  }

  const window = localDayToUtcWindow(options.date!, options.timezone!);
  return {
    ...full,
    date: options.date,
    timezone: options.timezone,
    window,
    findings: filterRowsByWindow(full.findings, window),
    timelineEvents: filterRowsByWindow(full.timelineEvents, window, "event_time"),
    tasks: filterRowsByWindow(full.tasks, window),
    queries: filterRowsByWindow(full.queries, window),
    indicators: filterRowsByWindow(full.indicators, window),
    systems: filterRowsByWindow(full.systems, window),
    accounts: filterRowsByWindow(full.accounts, window),
    entityLinks: filterRowsByWindow(full.entityLinks, window),
    tags: {
      custom: filterRowsByWindow(full.tags.custom, window),
      attack: full.tags.attack
    },
    activity: {
      created: groupActivity(full, window, "created_at"),
      updated: groupActivity(full, window, "updated_at")
    }
  };
}

export async function generateReportPreview(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  input: GenerateReportInput
) {
  await requirePermission(database, user, "report:generate");
  const template = await getTemplate(database, incidentId, input.templateId);
  if (template.report_type !== input.reportType) {
    throw new AppError(400, "Template report type does not match requested report type.");
  }

  const context = await buildReportContext(database, user, incidentId, input.reportType, {
    date: input.date,
    timezone: input.timezone
  });
  const rendered = renderReportTemplate(String(template.content), context);

  if (input.useLlm) {
    const markdown = await generateLlmMarkdown(database, user, String(template.content), context);
    return {
      preview: {
        title: buildReportTitle(context, input.reportType),
        markdown,
        reportType: input.reportType,
        reportDate: input.date ?? null,
        timezone: input.timezone ?? null,
        generationMode: "llm" as const,
        generatedContext: context,
        unresolvedPlaceholders: []
      }
    };
  }

  return {
    preview: {
      title: buildReportTitle(context, input.reportType),
      markdown: rendered.markdown,
      reportType: input.reportType,
      reportDate: input.date ?? null,
      timezone: input.timezone ?? null,
      generationMode: "deterministic" as const,
      generatedContext: context,
      unresolvedPlaceholders: rendered.unresolvedPlaceholders
    }
  };
}

function reportUploadDir(incidentId: string) {
  return path.join(getUploadsDir(), "reports", safePathSegment(incidentId));
}

function safeDisplayFilename(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }
  return path.basename(trimmed).replace(/[^\w.-]/g, "_") || fallback;
}

function isSafeStoredImageFilename(value: string) {
  return /^[0-9a-f-]{36}\.(gif|jpg|png|webp)$/i.test(value);
}

function contentTypeForStoredFilename(value: string) {
  const extension = path.extname(value).slice(1).toLowerCase();
  for (const [contentType, mappedExtension] of Object.entries(REPORT_IMAGE_EXTENSIONS)) {
    if (mappedExtension === extension) {
      return contentType;
    }
  }
  return "application/octet-stream";
}

export async function uploadReportImage(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  input: UploadReportImageInput
) {
  await requirePermission(database, user, "report:update");
  await requireIncidentMembership(database, user.id, incidentId);

  const extension = REPORT_IMAGE_EXTENSIONS[input.contentType];
  if (!extension) {
    throw new AppError(400, "Only PNG, JPEG, GIF, and WebP images can be uploaded.");
  }

  if (input.data.length === 0) {
    throw new AppError(400, "Image upload cannot be empty.");
  }

  if (input.data.length > MAX_REPORT_IMAGE_BYTES) {
    throw new AppError(413, "Image upload must be 10MB or smaller.");
  }

  const id = randomUUID();
  const filename = safeDisplayFilename(input.filename, "image");
  const storedFilename = `${id}.${extension}`;
  const directory = reportUploadDir(incidentId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storedFilename), input.data);

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "report.image.upload",
    entityType: "report",
    entityId: incidentId,
    afterJson: { filename, contentType: input.contentType, size: input.data.length },
  });

  return {
    id,
    url: `/api/uploads/reports/${safePathSegment(incidentId)}/${storedFilename}`,
    filename,
  };
}

export async function readReportImage(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  storedFilename: string
) {
  if (!isSafeStoredImageFilename(storedFilename)) {
    throw new AppError(404, "Image not found");
  }

  await requireIncidentMembership(database, user.id, incidentId);

  try {
    const data = await readFile(path.join(reportUploadDir(incidentId), storedFilename));
    return {
      data,
      contentType: contentTypeForStoredFilename(storedFilename),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new AppError(404, "Image not found");
    }
    throw error;
  }
}

export async function listReports(database: Database, user: AuthenticatedUser, incidentId: string) {
  await requirePermission(database, user, "report:read");
  await requireIncidentMembership(database, user.id, incidentId);
  const result = await database.query("select * from reports where incident_id = $1 order by created_at desc", [incidentId]);
  return result.rows;
}

export async function getReport(database: Database, user: AuthenticatedUser, incidentId: string, reportId: string) {
  await requirePermission(database, user, "report:read");
  await requireIncidentMembership(database, user.id, incidentId);
  return getReportRow(database, incidentId, reportId);
}

export async function createReport(database: Database, user: AuthenticatedUser, incidentId: string, input: CreateReportInput) {
  await requirePermission(database, user, "report:update");
  await requireIncidentMembership(database, user.id, incidentId);
  if (input.templateId) {
    await getTemplate(database, incidentId, input.templateId);
  }

  const reportId = randomUUID();
  await database.query(
    `
      insert into reports (
        id, incident_id, template_id, title, report_type, report_date, timezone, markdown,
        generation_mode, generated_context, unresolved_placeholders, created_by_user_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
    [
      reportId,
      incidentId,
      input.templateId ?? null,
      input.title,
      input.reportType,
      input.reportDate ?? null,
      input.timezone ?? null,
      input.markdown,
      input.generationMode,
      JSON.stringify(input.generatedContext),
      JSON.stringify(input.unresolvedPlaceholders ?? []),
      user.id
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "report.create",
    entityType: "report",
    entityId: reportId,
    afterJson: { title: input.title, reportType: input.reportType }
  });

  return getReportRow(database, incidentId, reportId);
}

export async function updateReport(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  reportId: string,
  input: { title?: string; markdown?: string }
) {
  await requirePermission(database, user, "report:update");
  await requireIncidentMembership(database, user.id, incidentId);
  const existing = await getReportRow(database, incidentId, reportId);
  await database.query(
    `
      update reports
      set title = $3, markdown = $4, updated_by_user_id = $5, updated_at = now()
      where id = $1 and incident_id = $2
    `,
    [reportId, incidentId, input.title ?? existing.title, input.markdown ?? existing.markdown, user.id]
  );
  return getReportRow(database, incidentId, reportId);
}

export async function deleteReport(database: Database, user: AuthenticatedUser, incidentId: string, reportId: string) {
  await requirePermission(database, user, "report:delete");
  await requireIncidentMembership(database, user.id, incidentId);
  const existing = await getReportRow(database, incidentId, reportId);
  await database.query("delete from reports where id = $1 and incident_id = $2", [reportId, incidentId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "report.delete",
    entityType: "report",
    entityId: reportId,
    beforeJson: existing
  });
}

export async function listPdfTemplates(database: Database, user: AuthenticatedUser, incidentId?: string | null) {
  await requirePermission(database, user, "report_template:create");
  const params: unknown[] = [user.id];
  let incidentFilter = "";
  if (incidentId) {
    await requireIncidentMembership(database, user.id, incidentId);
    params.push(incidentId);
    incidentFilter = "or (scope = 'incident' and incident_id = $2)";
  }
  const result = await database.query(
    `
      select *
      from pdf_templates
      where (scope = 'global' and created_by = $1) ${incidentFilter}
      order by is_default desc, updated_at desc
    `,
    params
  );
  return result.rows.map(mapPdfTemplate);
}

export async function createPdfTemplate(
  database: Database,
  user: AuthenticatedUser,
  input: CreatePdfTemplateInput
) {
  await requirePermission(database, user, "report_template:create");
  const normalized = await normalizePdfTemplateInput(database, user, input);
  const id = randomUUID();
  if (normalized.isDefault) {
    await clearDefaultPdfTemplate(database, user.id);
  }
  await database.query(
    `
      insert into pdf_templates (id, name, description, scope, incident_id, html_template, css, is_default, created_by)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      id,
      normalized.name,
      normalized.description,
      normalized.scope,
      normalized.incidentId,
      normalized.htmlTemplate,
      normalized.css,
      normalized.isDefault,
      user.id
    ]
  );
  return getPdfTemplate(database, user, id);
}

export async function updatePdfTemplate(
  database: Database,
  user: AuthenticatedUser,
  pdfTemplateId: string,
  input: UpdatePdfTemplateInput
) {
  await requirePermission(database, user, "report_template:update");
  const existing = await getPdfTemplateRow(database, user.id, pdfTemplateId);
  if (existing.scope === "incident" && existing.incident_id) {
    await requireIncidentMembership(database, user.id, String(existing.incident_id));
  }
  const normalized = await normalizePdfTemplateInput(database, user, {
    name: input.name ?? String(existing.name),
    description: input.description ?? (existing.description ? String(existing.description) : ""),
    scope: input.scope ?? existing.scope as "global" | "incident",
    incidentId: input.incidentId ?? (existing.incident_id ? String(existing.incident_id) : null),
    htmlTemplate: input.htmlTemplate ?? String(existing.html_template),
    css: input.css ?? String(existing.css ?? ""),
    isDefault: input.isDefault ?? Boolean(existing.is_default)
  });
  if (normalized.isDefault) {
    await clearDefaultPdfTemplate(database, user.id, pdfTemplateId);
  }
  await database.query(
    `
      update pdf_templates
      set name = $2,
          description = $3,
          scope = $4,
          incident_id = $5,
          html_template = $6,
          css = $7,
          is_default = $8,
          updated_at = now()
      where id = $1 and created_by = $9
    `,
    [
      pdfTemplateId,
      normalized.name,
      normalized.description,
      normalized.scope,
      normalized.incidentId,
      normalized.htmlTemplate,
      normalized.css,
      normalized.isDefault,
      user.id
    ]
  );
  return getPdfTemplate(database, user, pdfTemplateId);
}

export async function duplicatePdfTemplate(
  database: Database,
  user: AuthenticatedUser,
  pdfTemplateId: string,
  name?: string
) {
  const existing = await getPdfTemplate(database, user, pdfTemplateId);
  return createPdfTemplate(database, user, {
    name: name ?? `${existing.name} copy`,
    description: existing.description ?? "",
    scope: existing.scope,
    incidentId: existing.incidentId ?? null,
    htmlTemplate: existing.htmlTemplate,
    css: existing.css,
    isDefault: false
  });
}

export async function deletePdfTemplate(database: Database, user: AuthenticatedUser, pdfTemplateId: string) {
  await requirePermission(database, user, "report_template:delete");
  await getPdfTemplateRow(database, user.id, pdfTemplateId);
  await database.query("delete from pdf_templates where id = $1 and created_by = $2", [pdfTemplateId, user.id]);
}

export async function previewPdfTemplate(
  database: Database,
  user: AuthenticatedUser,
  input: { pdfTemplateId?: string; htmlTemplate?: string; css?: string; sampleMarkdown?: string }
) {
  await requirePermission(database, user, "report_template:create");
  const base = input.pdfTemplateId ? await getPdfTemplate(database, user, input.pdfTemplateId) : null;
  const htmlTemplate = input.htmlTemplate ?? base?.htmlTemplate ?? DEFAULT_PDF_HTML_TEMPLATE;
  const css = input.css ?? base?.css ?? DEFAULT_PDF_CSS;
  return {
    html: renderPdfHtml({
      report: {
        title: "Sample Incident Report",
        type: "incident",
        generatedAt: new Date("2026-05-22T00:00:00.000Z").toISOString(),
        markdown: input.sampleMarkdown ?? [
          "# Executive Summary",
          "",
          "This sample body shows how Markdown headings, tables, lists, and callouts inherit the branded PDF theme.",
          "",
          "## Key Observations",
          "",
          "- Identity compromise led to privileged cloud access.",
          "- Endpoint execution and SaaS abuse were correlated through shared indicators.",
          "- The PDF template, not the Markdown author, owns presentation.",
          "",
          "## Findings Snapshot",
          "",
          "| Finding | Severity | Status |",
          "| --- | --- | --- |",
          "| Credential phishing enabled identity compromise | critical | confirmed |",
          "| Cloud token abuse reached risky SaaS scopes | high | confirmed |",
          "| One browser helper execution was benign admin troubleshooting | low | false_positive |",
          "",
          "> Use the HTML/CSS PDF template to brand the document. Keep report authors focused on Markdown content and variables.",
          "",
          "## Recommended Actions",
          "",
          "1. Reset affected identities and revoke risky tokens.",
          "2. Preserve volatile evidence from impacted endpoints and cloud admin hosts.",
          "3. Review containment progress and assign follow-up tasks."
        ].join("\n")
      },
      incident: {
        name: "Sample Incident",
        clientName: "Example Client",
        status: "open"
      },
      htmlTemplate,
      css
    })
  };
}

export async function saveLlmSettings(
  database: Database,
  user: AuthenticatedUser,
  input: { provider: string; baseUrl?: string; model: string; systemPrompt?: string; apiKey?: string; customHeaders?: CustomHeaderInput[] }
) {
  await requirePermission(database, user, "llm_settings:manage");
  const existing = await readLlmSettings(database, user.id, { tolerateInvalidApiKey: true });
  const provider = normalizeLlmProvider(input.provider, input.model);
  const hasNewApiKey = Boolean(input.apiKey?.trim());
  if (!hasNewApiKey && existing?.apiKeyDecryptionFailed) {
    throw new AppError(400, "Stored LLM API key could not be decrypted. Re-enter the API key in Settings.");
  }
  const apiKey = hasNewApiKey ? input.apiKey! : (existing?.apiKey ?? "");
  const baseUrl = input.baseUrl?.trim()
    ? normalizeLlmBaseUrl(provider, input.baseUrl)
    : (existing?.baseUrl ?? null);
  const systemPrompt = input.systemPrompt?.trim() ?? "";
  const encrypted = encryptSecret(apiKey);
  const mask = maskApiKey(apiKey);
  const hasCustomHeaderInput = (input.customHeaders ?? []).some((header) => header.name.trim() || header.value);
  const customHeaders = hasCustomHeaderInput
    ? normalizeCustomHeaders(input.customHeaders ?? [])
    : (existing?.customHeaders ?? {});
  await database.query(
    `
      insert into llm_settings (user_id, provider_name, base_url, model, system_prompt, encrypted_api_key, api_key_mask, custom_headers_json)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (user_id) do update set
        provider_name = excluded.provider_name,
        base_url = excluded.base_url,
        model = excluded.model,
        system_prompt = excluded.system_prompt,
        encrypted_api_key = excluded.encrypted_api_key,
        api_key_mask = excluded.api_key_mask,
        custom_headers_json = excluded.custom_headers_json,
        updated_at = now()
    `,
    [user.id, provider, baseUrl, input.model, systemPrompt, encrypted, mask, JSON.stringify(customHeaders)]
  );
  return getMaskedLlmSettings(database, user);
}

export async function getMaskedLlmSettings(database: Database, user: AuthenticatedUser) {
  await requirePermission(database, user, "llm_settings:manage");
  return llmStatusFromConfig(await resolveLlmConfig(database, user.id, { tolerateInvalidApiKey: true }));
}

export async function deleteLlmSettings(database: Database, user: AuthenticatedUser) {
  await requirePermission(database, user, "llm_settings:manage");
  await database.query("delete from llm_settings where user_id = $1", [user.id]);
}

export async function testLlmSettings(database: Database, user: AuthenticatedUser) {
  await requirePermission(database, user, "llm_settings:manage");
  const config = await resolveLlmConfig(database, user.id);
  if (!config) {
    throw new AppError(400, "LLM settings are not configured.");
  }
  try {
    await callLiteLlmGenerateReportService(
      config.serviceUrl,
      buildLiteLlmGenerateReportPayload(
        toLiteLlmServiceConfig(config),
        "incident",
        "# LLM connection test\n\nReturn a short Markdown response.",
        buildLlmConnectionTestContext()
      )
    );
    return { ok: true, model: config.model, source: config.source };
  } catch {
    return { ok: false, error: "LLM generation service failed", model: config.model, source: config.source };
  }
}

export async function exportReportPdf(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  reportId: string,
  options: { pdfTemplateId?: string } = {}
) {
  await requirePermission(database, user, "report:export");
  await requireIncidentMembership(database, user.id, incidentId);
  const report = await getReportRow(database, incidentId, reportId);
  const incident = await one(
    database,
    `
      select i.*, c.client_name
      from incidents i
      inner join cases c on c.id = i.case_id
      where i.id = $1
    `,
    [incidentId],
    "Incident not found"
  );
  const pdfTemplate = await resolvePdfTemplate(database, user, incidentId, options.pdfTemplateId);
  const renderedHtml = renderPdfHtml({
    report: {
      title: String(report.title),
      type: String(report.report_type),
      generatedAt: new Date().toISOString(),
      markdown: String(report.markdown)
    },
    incident: {
      name: String(incident.name ?? "Not provided"),
      clientName: String(incident.client_name ?? "Not provided"),
      status: String(incident.status ?? "Not provided")
    },
    htmlTemplate: pdfTemplate.htmlTemplate,
    css: pdfTemplate.css
  });
  const finalHtml = await inlineReportUploadImagesForPdf(renderedHtml, incidentId);
  let pdf: Buffer;
  try {
    pdf = await renderHtmlToPdf(finalHtml);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(500, `PDF export failed: ${message}`);
  }
  const exportId = randomUUID();
  const fileName = `${safePathSegment(String(report.title)) || "report"}.pdf`;
  await database.query(
    `
      insert into report_exports (id, report_id, incident_id, file_url, file_name, created_by_user_id)
      values ($1, $2, $3, $4, $5, $6)
    `,
    [exportId, reportId, incidentId, "", fileName, user.id]
  );

  return {
    pdf,
    fileName,
    metadata: {
      id: exportId,
      reportId,
      incidentId,
      fileName,
      createdAt: new Date().toISOString()
    }
  };
}

export async function inlineReportUploadImagesForPdf(html: string, incidentId: string) {
  const safeIncidentId = safePathSegment(incidentId);
  const imagePattern = new RegExp(
    `<img\\b([^>]*?)\\bsrc="(/api/uploads/reports/${safeIncidentId}/([0-9a-f-]{36}\\.(?:gif|jpg|png|webp)))"([^>]*)>`,
    "gi"
  );

  const matches = [...html.matchAll(imagePattern)];
  if (matches.length === 0) {
    return html;
  }

  const replacements = await Promise.all(matches.map(async (match) => {
    const [fullMatch, beforeSrc, _url, storedFilename, afterSrc] = match;
    if (!isSafeStoredImageFilename(storedFilename)) {
      return [fullMatch, fullMatch] as const;
    }

    try {
      const buffer = await readFile(path.join(reportUploadDir(incidentId), storedFilename));
      const contentType = contentTypeForStoredFilename(storedFilename);
      const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
      return [fullMatch, `<img${beforeSrc}src="${dataUrl}"${afterSrc}>`] as const;
    } catch {
      return [fullMatch, fullMatch] as const;
    }
  }));

  let nextHtml = html;
  for (const [source, replacement] of replacements) {
    nextHtml = nextHtml.replace(source, replacement);
  }
  return nextHtml;
}

export function renderReportTemplate(template: string, context: ReportContext) {
  const unresolved = new Set<string>();
  const markdown = template.replace(/{{\s*([^}]+?)\s*}}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();
    const value = resolvePlaceholder(key, context);
    if (value === MISSING_PLACEHOLDER) {
      unresolved.add(key);
      return `{{${key}}}`;
    }
    return renderReportValue(value);
  });
  return { markdown, unresolvedPlaceholders: [...unresolved].sort() };
}

function buildReportTitle(context: ReportContext, reportType: ReportType) {
  const incidentName = typeof context.incident.name === "string" ? context.incident.name : "Incident";
  return reportType === "daily" ? `${incidentName} daily report ${context.date}` : `${incidentName} incident report`;
}

async function buildFullIncidentContext(
  database: Database,
  incidentId: string,
  reportType: ReportType,
  options: { date?: string; timezone?: string }
): Promise<ReportContext> {
  const [incident, findings, timelineEvents, tasks, queries, indicators, systems, accounts, members, links, customTags, attackTags] =
    await Promise.all([
      one(
        database,
        `
          select
            i.*,
            c.case_name,
            c.client_name,
            c.start_date,
            c.end_date
          from incidents i
          inner join cases c on c.id = i.case_id
          where i.id = $1
        `,
        [incidentId],
        "Incident not found"
      ),
      all(database, "select * from findings where incident_id = $1 order by created_at desc", [incidentId]),
      all(database, "select * from timeline_events where incident_id = $1 order by event_time desc", [incidentId]),
      all(database, "select * from tasks where incident_id = $1 order by created_at desc", [incidentId]),
      all(database, "select * from queries where incident_id = $1 order by created_at desc", [incidentId]),
      all(database, "select * from indicators where incident_id = $1 order by created_at desc", [incidentId]),
      all(database, "select * from systems where incident_id = $1 order by created_at desc", [incidentId]),
      all(database, "select * from accounts where incident_id = $1 order by created_at desc", [incidentId]),
      all(database, "select * from incident_members where incident_id = $1 order by added_at desc", [incidentId]),
      all(database, "select * from incident_entity_links where incident_id = $1 order by created_at desc", [incidentId]),
      all(
        database,
        `
          select distinct ct.*
          from custom_tags ct
          inner join incidents i on i.case_id = ct.case_id
          where i.id = $1
          order by ct.name asc
        `,
        [incidentId]
      ),
      all(
        database,
        `
          select distinct at.*
          from attack_tags at
          left join finding_attack_tags fat on fat.attack_tag_id = at.id and fat.incident_id = $1
          left join timeline_event_attack_tags tat on tat.attack_tag_id = at.id and tat.incident_id = $1
          where fat.attack_tag_id is not null or tat.attack_tag_id is not null
          order by at.attack_id asc
        `,
        [incidentId]
      )
    ]);

  const tasksWithNotes = await Promise.all(tasks.map(async (task) => ({ ...task, note: await readTaskNoteContent(String(task.id)) })));
  const incidentContext = {
    ...incident,
    caseName: incident.case_name,
    clientName: incident.client_name,
    startDate: incident.start_date,
    endDate: incident.end_date
  };

  return {
    generatedAt: new Date().toISOString(),
    reportType,
    date: options.date,
    timezone: options.timezone,
    incident: incidentContext,
    findings,
    timelineEvents,
    tasks: tasksWithNotes,
    queries,
    indicators,
    systems,
    accounts,
    members,
    entityLinks: links,
    tags: {
      custom: customTags,
      attack: attackTags
    }
  };
}

async function getTemplate(database: Database, incidentId: string, templateId: string) {
  return one(database, "select * from report_templates where id = $1 and incident_id = $2", [templateId, incidentId], "Report template not found");
}

async function getReportRow(database: Database, incidentId: string, reportId: string) {
  return one(database, "select * from reports where id = $1 and incident_id = $2", [reportId, incidentId], "Report not found");
}

async function getPdfTemplate(database: Database, user: AuthenticatedUser, pdfTemplateId: string): Promise<PdfTemplate> {
  const row = await getPdfTemplateRow(database, user.id, pdfTemplateId);
  if (row.scope === "incident" && row.incident_id) {
    await requireIncidentMembership(database, user.id, String(row.incident_id));
  }
  return mapPdfTemplate(row);
}

async function getPdfTemplateRow(database: Database, userId: string, pdfTemplateId: string) {
  return one(
    database,
    "select * from pdf_templates where id = $1 and created_by = $2",
    [pdfTemplateId, userId],
    "PDF template not found"
  );
}

async function normalizePdfTemplateInput(database: Database, user: AuthenticatedUser, input: CreatePdfTemplateInput) {
  const scope = input.scope ?? "global";
  const incidentId = scope === "incident" ? input.incidentId ?? null : null;
  if (scope === "incident") {
    if (!incidentId) {
      throw new AppError(400, "Incident PDF templates require incidentId.");
    }
    await requireIncidentMembership(database, user.id, incidentId);
  }
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    scope,
    incidentId,
    htmlTemplate: input.htmlTemplate,
    css: input.css ?? "",
    isDefault: Boolean(input.isDefault)
  };
}

async function clearDefaultPdfTemplate(database: Database, userId: string, exceptId?: string) {
  if (exceptId) {
    await database.query("update pdf_templates set is_default = false where created_by = $1 and id <> $2", [userId, exceptId]);
    return;
  }
  await database.query("update pdf_templates set is_default = false where created_by = $1", [userId]);
}

async function resolvePdfTemplate(database: Database, user: AuthenticatedUser, incidentId: string, pdfTemplateId?: string) {
  if (pdfTemplateId) {
    const template = await getPdfTemplate(database, user, pdfTemplateId);
    if (template.scope === "incident" && template.incidentId !== incidentId) {
      throw new AppError(404, "PDF template not found");
    }
    return template;
  }

  const result = await database.query(
    `
      select *
      from pdf_templates
      where created_by = $1 and is_default = true and (scope = 'global' or incident_id = $2)
      order by scope desc
      limit 1
    `,
    [user.id, incidentId]
  );
  if ((result.rowCount ?? 0) > 0) {
    return mapPdfTemplate(result.rows[0]);
  }

  return {
    id: "builtin-default",
    name: "Built-in Default",
    description: "Forenotes built-in PDF template",
    scope: "global" as const,
    incidentId: null,
    htmlTemplate: DEFAULT_PDF_HTML_TEMPLATE,
    css: DEFAULT_PDF_CSS,
    isDefault: false,
    createdBy: "system",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString()
  };
}

function mapPdfTemplate(row: DbRow): PdfTemplate {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    scope: row.scope as "global" | "incident",
    incidentId: row.incident_id ? String(row.incident_id) : null,
    htmlTemplate: String(row.html_template),
    css: String(row.css ?? ""),
    isDefault: Boolean(row.is_default),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

async function one(database: Database, text: string, params: unknown[], notFoundMessage: string) {
  const result = await database.query(text, params);
  if (result.rowCount === 0) {
    throw new AppError(404, notFoundMessage);
  }
  return result.rows[0];
}

async function all(database: Database, text: string, params: unknown[]) {
  const result = await database.query<DbRow>(text, params);
  return result.rows;
}

async function readTaskNoteContent(taskId: string) {
  try {
    return await readFile(path.join(getDataDir(), "notes", `${safePathSegment(taskId)}.md`), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

const MISSING_PLACEHOLDER = Symbol("missing report placeholder");
const PREFERRED_REPORT_COLUMNS = [
  "title",
  "severity",
  "status",
  "description",
  "event_time",
  "eventTime",
  "source",
  "priority",
  "note",
  "name",
  "type",
  "value",
  "confidence",
  "attack_id",
  "tactic",
  "summary",
  "clientName",
  "caseName"
];
const HIDDEN_REPORT_COLUMNS = new Set([
  "id",
  "incident_id",
  "incidentId",
  "created_by_user_id",
  "createdByUserId",
  "owner_user_id",
  "ownerUserId",
  "assignee_user_id",
  "assigneeUserId",
  "updated_by_user_id",
  "updatedByUserId",
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt"
]);

function resolvePlaceholder(key: string, context: ReportContext): unknown | typeof MISSING_PLACEHOLDER {
  const activityValue = resolveActivityPlaceholder(key, context);
  if (activityValue !== MISSING_PLACEHOLDER) {
    return activityValue;
  }

  if (key === "incident.startDate" || key === "incident.endDate") {
    const incident = context.incident as Record<string, unknown>;
    const camelKey = key.split(".")[1];
    const snakeKey = camelKey === "startDate" ? "start_date" : "end_date";
    return incident[camelKey] ?? incident[snakeKey] ?? null;
  }

  if (key === "findings.count") {
    return context.findings.length;
  }
  if (key === "findings.list") {
    return markdownList(context.findings, "title");
  }
  if (key === "findings.table") {
    return markdownTable(context.findings, ["title", "severity", "status"]);
  }
  if (key === "timeline.count") {
    return context.timelineEvents.length;
  }
  if (key === "timeline.list") {
    return markdownList(context.timelineEvents, "title");
  }
  if (key === "timeline.table") {
    return markdownTable(context.timelineEvents, ["event_time", "title", "source"]);
  }
  if (key === "tasks.count") {
    return context.tasks.length;
  }
  if (key === "tasks.list") {
    return markdownList(context.tasks, "title");
  }
  if (key === "tasks.table") {
    return markdownTable(context.tasks, ["title", "status", "priority"]);
  }
  if (key === "notes.count") {
    return context.tasks.filter((task) => task.note).length;
  }
  if (key === "notes.list") {
    return markdownList(context.tasks.filter((task) => task.note), "note");
  }
  if (key === "tags.count") {
    return context.tags.custom.length + context.tags.attack.length;
  }
  if (key === "tags.list") {
    return markdownList([...context.tags.custom, ...context.tags.attack], "name");
  }
  if (key === "mitre.count") {
    return context.tags.attack.length;
  }
  if (key === "mitre.list") {
    return markdownList(context.tags.attack, "name");
  }
  if (key === "mitre.table") {
    return markdownTable(context.tags.attack, ["attack_id", "name", "tactic"]);
  }
  if (key === "entities.count") {
    return context.systems.length + context.accounts.length + context.indicators.length;
  }
  if (key === "entities.list") {
    return markdownListValues([
      ...context.systems.map((row) => row.hostname),
      ...context.accounts.map((row) => row.username),
      ...context.indicators.map((row) => row.value)
    ]);
  }
  if (key === "entities.table") {
    return markdownTable(
      [
        ...context.systems.map((row) => ({ type: "system", name: row.hostname, status: row.status ?? "" })),
        ...context.accounts.map((row) => ({ type: "account", name: row.username, status: row.status ?? "" })),
        ...context.indicators.map((row) => ({ type: "indicator", name: row.value, status: row.confidence ?? "" }))
      ],
      ["type", "name", "status"]
    );
  }
  if (key === "links.count") {
    return context.entityLinks.length;
  }
  if (key === "links.list") {
    return markdownListValues(context.entityLinks.map((link) => `${cell(link.source_type)} ${cell(link.link_type)} ${cell(link.target_type)}`));
  }
  if (key === "links.table") {
    return markdownTable(context.entityLinks, ["source_type", "link_type", "target_type"]);
  }
  if (key === "queries.table") {
    return markdownTable(context.queries, ["name", "language"]);
  }
  if (key === "indicators.table") {
    return markdownTable(context.indicators, ["indicator_type", "value", "confidence"]);
  }

  const structuredValue = resolveStructuredFormatter(key, context);
  if (structuredValue !== MISSING_PLACEHOLDER) {
    return structuredValue;
  }

  return resolvePathValue(key, context);
}

function resolveActivityPlaceholder(key: string, context: ReportContext) {
  const activityMap: Record<string, { bucket: "created" | "updated"; name: string; columns?: string[]; listField?: string }> = {
    "activity.findingsCreated.table": { bucket: "created", name: "findings", columns: ["title", "severity", "status"] },
    "activity.findingsUpdated.table": { bucket: "updated", name: "findings", columns: ["title", "severity", "status"] },
    "activity.timelineCreated.table": { bucket: "created", name: "timelineEvents", columns: ["event_time", "title", "source"] },
    "activity.timelineUpdated.table": { bucket: "updated", name: "timelineEvents", columns: ["event_time", "title", "source"] },
    "activity.tasksCreated.table": { bucket: "created", name: "tasks", columns: ["title", "status", "priority"] },
    "activity.tasksUpdated.table": { bucket: "updated", name: "tasks", columns: ["title", "status", "priority"] },
    "activity.notesCreated.list": { bucket: "created", name: "notes", listField: "note" },
    "activity.notesUpdated.list": { bucket: "updated", name: "notes", listField: "note" },
    "activity.linksCreated.list": { bucket: "created", name: "links", listField: "link" }
  };
  const definition = activityMap[key];
  if (!definition) {
    return MISSING_PLACEHOLDER;
  }

  const rows = activityRows(context, definition.bucket, definition.name);
  if (definition.columns) {
    return markdownTable(rows, definition.columns);
  }
  if (definition.name === "links") {
    return markdownListValues(rows.map((link) => `${cell(link.source_type)} ${cell(link.link_type)} ${cell(link.target_type)}`));
  }
  return markdownList(rows, definition.listField ?? "title");
}

function activityRows(context: ReportContext, bucket: "created" | "updated", name: string) {
  const activity = context.activity as { created?: Record<string, unknown>; updated?: Record<string, unknown> } | undefined;
  const rows = activity?.[bucket]?.[name];
  return Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
}

function markdownTable(rows: Record<string, unknown>[], columns: string[]) {
  if (rows.length === 0) {
    return "No items.";
  }
  const header = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(row[column])).join(" | ")} |`);
  return [header, separator, ...body].join("\n");
}

function markdownList(rows: Record<string, unknown>[], field: string) {
  return markdownListValues(rows.map((row) => row[field]));
}

function markdownListValues(values: unknown[]) {
  const lines = values.map(cell).filter(Boolean).map((value) => `- ${value}`);
  return lines.length > 0 ? lines.join("\n") : "No items.";
}

function resolveStructuredFormatter(key: string, context: ReportContext): unknown | typeof MISSING_PLACEHOLDER {
  const parts = key.split(".");
  const format = parts.at(-1);
  if (format !== "table" && format !== "list" && format !== "count" && format !== "json") {
    return MISSING_PLACEHOLDER;
  }

  const baseKey = parts.slice(0, -1).join(".");
  const value = resolveStructuredBaseValue(baseKey, context);
  if (value === MISSING_PLACEHOLDER) {
    return MISSING_PLACEHOLDER;
  }

  if (format === "count") {
    if (Array.isArray(value)) return value.length;
    if (isRecord(value)) return Object.keys(value).length;
    return value === null || value === undefined ? 0 : 1;
  }
  if (format === "json") {
    return `\`\`\`json\n${JSON.stringify(value ?? null, null, 2)}\n\`\`\``;
  }
  if (format === "table") {
    if (Array.isArray(value) && value.every(isRecord)) {
      return renderDynamicMarkdownTable(value);
    }
    if (isRecord(value)) {
      return renderDynamicMarkdownTable([value]);
    }
    return renderReportValue(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => `- ${renderListItem(item)}`).join("\n") : "Not provided";
  }
  return renderReportValue(value);
}

function resolveStructuredBaseValue(baseKey: string, context: ReportContext): unknown | typeof MISSING_PLACEHOLDER {
  if (baseKey === "timeline") {
    return context.timelineEvents;
  }
  if (baseKey === "notes") {
    return context.tasks.map((task) => task.note).filter(Boolean);
  }
  if (baseKey === "tags") {
    return [...context.tags.custom, ...context.tags.attack];
  }
  if (baseKey === "mitre") {
    return context.tags.attack;
  }
  if (baseKey === "entities") {
    return [
      ...context.systems.map((row) => ({ type: "system", name: row.hostname, status: row.status ?? "" })),
      ...context.accounts.map((row) => ({ type: "account", name: row.username, status: row.status ?? "" })),
      ...context.indicators.map((row) => ({ type: "indicator", name: row.value, status: row.confidence ?? "" }))
    ];
  }
  if (baseKey === "links") {
    return context.entityLinks;
  }
  return resolvePathValue(baseKey, context);
}

function resolvePathValue(key: string, context: ReportContext): unknown | typeof MISSING_PLACEHOLDER {
  let current: unknown = context;
  for (const part of key.split(".")) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return MISSING_PLACEHOLDER;
    }
  }
  return current;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map(cell).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  }
  return String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function renderReportValue(value: unknown) {
  if (value === null || value === undefined) {
    return "Not provided";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Not provided";
    }
    if (value.every(isRecord)) {
      return renderDynamicMarkdownTable(value);
    }
    return value.map((item) => `- ${renderListItem(item)}`).join("\n");
  }
  if (isRecord(value)) {
    return renderDynamicMarkdownTable([value]);
  }
  return String(value);
}

function renderListItem(value: unknown) {
  if (!isRecord(value)) {
    return cell(value);
  }
  return Object.entries(value)
    .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && cell(entryValue) !== "")
    .map(([key, entryValue]) => `${formatHeader(key)}: ${cell(entryValue)}`)
    .join("; ");
}

function renderDynamicMarkdownTable(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return "Not provided";
  }
  const availableColumns = rows.reduce<Set<string>>((keys, row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (value !== null && value !== undefined && cell(value) !== "" && !HIDDEN_REPORT_COLUMNS.has(key)) {
        keys.add(key);
      }
    });
    return keys;
  }, new Set<string>());
  const preferredColumns = PREFERRED_REPORT_COLUMNS.filter((column) => availableColumns.has(column));
  const remainingColumns = Array.from(availableColumns).filter((column) => !preferredColumns.includes(column));
  const columns = [...preferredColumns, ...remainingColumns].slice(0, 6);
  if (columns.length === 0) {
    return "Not provided";
  }
  const header = `| ${columns.map(formatHeader).join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(row[column])).join(" | ")} |`);
  return [header, separator, ...body].join("\n");
}

function formatHeader(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function localDayToUtcWindow(date: string, timezone: string) {
  assertValidTimezone(timezone);
  const [year, month, day] = date.split("-").map(Number);
  const start = zonedLocalToUtc(year, month, day, timezone);
  const end = zonedLocalToUtc(year, month, day + 1, timezone);
  return { start: start.toISOString(), end: end.toISOString() };
}

function zonedLocalToUtc(year: number, month: number, day: number, timezone: string) {
  let utc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  for (let index = 0; index < 3; index += 1) {
    const parts = localParts(new Date(utc), timezone);
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, 0);
    utc -= asUtc - Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  }
  return new Date(utc);
}

function localParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

function assertValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    throw new AppError(400, "Invalid timezone.");
  }
}

function filterRowsByWindow<T extends Record<string, unknown>>(rows: T[], window: { start: string; end: string }, preferred?: string) {
  return rows.filter((row) => rowInWindow(row, window, preferred));
}

function groupActivity(context: ReportContext, window: { start: string; end: string }, field: "created_at" | "updated_at") {
  return {
    findings: context.findings.filter((row) => timestampInWindow(row[field], window)),
    timelineEvents: context.timelineEvents.filter((row) => timestampInWindow(row[field], window)),
    tasks: context.tasks.filter((row) => timestampInWindow(row[field], window)),
    notes: context.tasks.filter((row) => row.note && timestampInWindow(row[field], window)),
    links: context.entityLinks.filter((row) => timestampInWindow(row[field], window)),
    tags: context.tags.custom.filter((row) => timestampInWindow(row[field], window)),
    mitreMappings: context.tags.attack.filter((row) => timestampInWindow(row[field], window))
  };
}

function rowInWindow(row: Record<string, unknown>, window: { start: string; end: string }, preferred?: string) {
  return [preferred, "created_at", "updated_at"].some((field) => field && timestampInWindow(row[field], window));
}

function timestampInWindow(value: unknown, window: { start: string; end: string }) {
  if (!value) {
    return false;
  }
  const time = new Date(String(value)).getTime();
  return time >= Date.parse(window.start) && time < Date.parse(window.end);
}

function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

function decryptSecret(encrypted: string) {
  const [ivRaw, tagRaw, payloadRaw] = encrypted.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payloadRaw, "base64")), decipher.final()]).toString("utf8");
}

function encryptionKey() {
  const secret = env.FORENOTES_LLM_SECRET_KEY;
  if (secret && secret.length >= 32) {
    return createHash("sha256").update(secret).digest();
  }
  if (process.env.NODE_ENV === "production") {
    throw new AppError(500, "FORENOTES_LLM_SECRET_KEY is required in production.");
  }
  return createHash("sha256").update("forenotes-development-llm-key").digest();
}

function maskApiKey(value: string) {
  return value.length <= 8 ? "****" : `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function readLlmSettings(database: Database, userId: string, options: { tolerateInvalidApiKey?: boolean } = {}) {
  const result = await database.query("select * from llm_settings where user_id = $1", [userId]);
  if (result.rowCount === 0) {
    return null;
  }
  const row = result.rows[0];
  const model = String(row.model);
  const provider = normalizeLlmProvider(row.provider_name ? String(row.provider_name) : null, model);
  // validateLlmProvider(provider);
  const decryptedApiKey = decryptLlmApiKey(String(row.encrypted_api_key), options);
  return {
    provider,
    baseUrl: normalizeLlmBaseUrl(provider, row.base_url ? String(row.base_url) : null),
    serviceUrl: resolveLiteLlmServiceUrl(),
    model,
    systemPrompt: row.system_prompt ? String(row.system_prompt) : "",
    apiKey: decryptedApiKey.value,
    apiKeyDecryptionFailed: decryptedApiKey.failed,
    customHeaders: normalizeStoredHeaders(row.custom_headers_json),
    source: "user" as const,
    endpointConfigured: Boolean(row.base_url),
    apiKeyMask: String(row.api_key_mask),
    updatedAt: row.updated_at
  };
}

async function generateLlmMarkdown(database: Database, user: AuthenticatedUser, template: string, context: ReportContext) {
  const config = await resolveLlmConfig(database, user.id);
  if (!config) {
    throw new AppError(400, "LLM is not configured. Add provider settings or set LLM_PROVIDER, LLM_MODEL, and LLM_API_KEY.");
  }
  try {
    return await callLiteLlmGenerateReportService(
      config.serviceUrl,
      buildLiteLlmGenerateReportPayload(toLiteLlmServiceConfig(config), context.reportType, template, context)
    );
  } catch {
    throw new AppError(502, "LLM generation service failed.");
  }
}

async function resolveLlmConfig(
  database: Database,
  userId: string,
  options: { tolerateInvalidApiKey?: boolean } = {}
): Promise<LlmProviderConfig | null> {
  const userSettings = await readLlmSettings(database, userId, options);
  if (userSettings) {
    return userSettings;
  }

  const apiKey = process.env.LLM_API_KEY?.trim();
  const model = process.env.LLM_MODEL?.trim();
  const systemPrompt = process.env.LLM_SYSTEM_PROMPT?.trim() ?? "";
  if (!model) {
    return null;
  }
  const provider = normalizeLlmProvider(process.env.LLM_PROVIDER, model);
  // validateLlmProvider(provider);
  const baseUrl = normalizeLlmBaseUrl(provider, process.env.LLM_API_ENDPOINT?.trim() || null);

  return {
    provider,
    baseUrl,
    serviceUrl: resolveLiteLlmServiceUrl(),
    model,
    systemPrompt,
    apiKey: apiKey ?? "",
    customHeaders: parseEnvCustomHeaders(),
    source: "env",
    endpointConfigured: Boolean(baseUrl),
    apiKeyMask: maskApiKey(apiKey ?? "")
  };
}

function llmStatusFromConfig(config: LlmProviderConfig | null): LlmSettingsStatus {
  if (!config) {
    return {
      configured: false,
      source: null,
      provider: "",
      model: "",
      systemPrompt: "",
      systemPromptConfigured: false,
      endpointConfigured: false,
      apiKeyConfigured: false,
      customHeadersConfigured: false,
      customHeaders: []
    };
  }

  return {
    configured: true,
    source: config.source,
    provider: config.provider,
    model: config.model,
    systemPrompt: config.systemPrompt,
    systemPromptConfigured: Boolean(config.systemPrompt.trim()),
    endpointConfigured: config.endpointConfigured,
    apiKeyConfigured: Boolean(config.apiKey || (config.source === "user" && config.apiKeyMask)),
    customHeadersConfigured: Object.keys(config.customHeaders).length > 0,
    customHeaders: Object.keys(config.customHeaders).sort().map((name) => ({ name, configured: true }))
  };
}

function decryptLlmApiKey(encrypted: string, options: { tolerateInvalidApiKey?: boolean }) {
  try {
    if (!isEncryptedSecretShape(encrypted)) {
      throw new Error("Invalid encrypted secret.");
    }
    return { value: decryptSecret(encrypted), failed: false };
  } catch {
    if (options.tolerateInvalidApiKey) {
      return { value: "", failed: true };
    }
    throw new AppError(400, "Stored LLM API key could not be decrypted. Re-enter the API key in Settings.");
  }
}

function isEncryptedSecretShape(encrypted: string) {
  const [ivRaw, tagRaw, payloadRaw, extra] = encrypted.split(".");
  if (extra !== undefined || ivRaw === undefined || tagRaw === undefined || payloadRaw === undefined) {
    return false;
  }
  return Buffer.from(ivRaw, "base64").length === 12 && Buffer.from(tagRaw, "base64").length === 16;
}

function toLiteLlmServiceConfig(config: LlmProviderConfig): LiteLlmServiceConfig {
  return {
    serviceUrl: config.serviceUrl,
    provider: config.provider,
    model: config.model,
    systemPrompt: config.systemPrompt,
    apiKey: config.apiKey,
    apiBase: config.baseUrl,
    customHeaders: config.customHeaders
  };
}

function buildLlmConnectionTestContext(): ReportContext {
  return {
    generatedAt: new Date().toISOString(),
    reportType: "incident",
    incident: { name: "LLM connection test", status: "test" },
    findings: [],
    timelineEvents: [],
    tasks: [],
    queries: [],
    indicators: [],
    systems: [],
    accounts: [],
    members: [],
    entityLinks: [],
    tags: { custom: [], attack: [] }
  };
}

function normalizeCustomHeaders(headers: CustomHeaderInput[]) {
  const normalized: Record<string, string> = {};
  for (const header of headers) {
    const name = header.name.trim();
    if (!name || !isSafeHeaderName(name)) {
      throw new AppError(400, "Custom header names may only contain standard HTTP token characters.");
    }
    if (!isAllowedCustomHeaderName(name)) {
      throw new AppError(400, "Custom header names cannot override credentials, proxy, host, or forwarding headers.");
    }
    if (/[\r\n]/.test(header.value)) {
      throw new AppError(400, "Custom header values cannot contain newlines.");
    }
    normalized[name] = header.value;
  }
  return normalized;
}

function normalizeStoredHeaders(value: unknown) {
  if (typeof value === "string") {
    try {
      return normalizeStoredHeaders(JSON.parse(value));
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const headers: Record<string, string> = {};
  for (const [name, headerValue] of Object.entries(value)) {
    if (isSafeHeaderName(name) && isAllowedCustomHeaderName(name) && typeof headerValue === "string" && !/[\r\n]/.test(headerValue)) {
      headers[name] = headerValue;
    }
  }
  return headers;
}

function parseEnvCustomHeaders() {
  const raw = process.env.LLM_CUSTOM_HEADERS_JSON?.trim();
  if (!raw) {
    return {};
  }
  try {
    return normalizeStoredHeaders(JSON.parse(raw));
  } catch {
    throw new AppError(500, "LLM_CUSTOM_HEADERS_JSON must be valid JSON.");
  }
}

function isSafeHeaderName(name: string) {
  return /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name);
}

function isAllowedCustomHeaderName(name: string) {
  const lower = name.toLowerCase();
  if (BLOCKED_CUSTOM_HEADERS.has(lower)) {
    return false;
  }
  return !(
    lower.startsWith("proxy-") ||
    lower.startsWith("x-forwarded-") ||
    lower.startsWith("cf-") ||
    lower === "true-client-ip"
  );
}

function validateLlmProvider(provider: string) {
  if (!ALLOWED_LLM_PROVIDERS.has(provider)) {
    throw new AppError(400, "Unsupported LLM provider.");
  }
}

function normalizeLlmBaseUrl(provider: string, rawBaseUrl: string | null | undefined) {
  const value = rawBaseUrl?.trim();
  if (!value) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new AppError(400, "LLM API base URL must be a valid URL.");
  }

  if (parsed.protocol !== "https:" && !isAllowedLocalLlmEndpoint(provider, parsed)) {
    throw new AppError(400, "LLM API base URL must use HTTPS unless local development endpoints are explicitly allowed.");
  }

  if (isBlockedLlmHost(parsed.hostname)) {
    throw new AppError(400, "LLM API base URL cannot target local, private, link-local, or metadata hosts.");
  }

  return parsed.toString().replace(/\/+$/, "");
}

function isAllowedLocalLlmEndpoint(provider: string, url: URL) {
  return provider === "ollama" && process.env.NODE_ENV !== "production" && url.protocol === "http:" && isLoopbackHost(url.hostname);
}

function isBlockedLlmHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isLoopbackHost(host) || host === "metadata.google.internal" || host.endsWith(".internal") || host.endsWith(".local")) {
    return true;
  }
  if (process.env.NODE_ENV === "production" && !host.includes(".")) {
    return true;
  }
  if (isIP(host) === 4) {
    return isBlockedIpv4(host);
  }
  if (isIP(host) === 6) {
    return isBlockedIpv6(host);
  }
  return false;
}

function isLoopbackHost(host: string) {
  return host === "localhost" || host === "::1" || host === "127.0.0.1" || host.startsWith("127.");
}

function isBlockedIpv4(host: string) {
  const octets = host.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first === 169 && second === 254 ||
    first === 172 && second >= 16 && second <= 31 ||
    first === 192 && second === 168 ||
    first === 100 && second >= 64 && second <= 127 ||
    first === 198 && (second === 18 || second === 19) ||
    first >= 224
  );
}

function isBlockedIpv6(host: string) {
  return (
    host === "::1" ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("fe80:") ||
    host.startsWith("::ffff:127.") ||
    host.startsWith("::ffff:10.") ||
    host.startsWith("::ffff:192.168.") ||
    host.startsWith("::ffff:169.254.")
  );
}

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}
