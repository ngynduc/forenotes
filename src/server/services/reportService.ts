import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LlmSettingsStatus, PdfTemplate, ReportContext, ReportGenerationMode } from "../../shared/reportTypes.js";
import type { ReportType } from "../../shared/domain.js";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { getDataDir } from "../storage.js";
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

type DbRow = Record<string, unknown>;

interface LlmProviderConfig {
  provider: string;
  baseUrl: string | null;
  serviceUrl: string;
  model: string;
  apiKey: string;
  customHeaders: Record<string, string>;
  source: "user" | "env";
  endpointConfigured: boolean;
  apiKeyMask?: string | null;
  updatedAt?: unknown;
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
        markdown: input.sampleMarkdown ?? "# Executive Summary\n\nThis is a sample report body."
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
  input: { provider: string; baseUrl?: string; model: string; apiKey?: string; customHeaders?: CustomHeaderInput[] }
) {
  await requirePermission(database, user, "llm_settings:manage");
  const apiKey = input.apiKey ?? "";
  const encrypted = encryptSecret(apiKey);
  const mask = maskApiKey(apiKey);
  const customHeaders = normalizeCustomHeaders(input.customHeaders ?? []);
  await database.query(
    `
      insert into llm_settings (user_id, provider_name, base_url, model, encrypted_api_key, api_key_mask, custom_headers_json)
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (user_id) do update set
        provider_name = excluded.provider_name,
        base_url = excluded.base_url,
        model = excluded.model,
        encrypted_api_key = excluded.encrypted_api_key,
        api_key_mask = excluded.api_key_mask,
        custom_headers_json = excluded.custom_headers_json,
        updated_at = now()
    `,
    [user.id, input.provider, input.baseUrl || null, input.model, encrypted, mask, JSON.stringify(customHeaders)]
  );
  return getMaskedLlmSettings(database, user);
}

export async function getMaskedLlmSettings(database: Database, user: AuthenticatedUser) {
  await requirePermission(database, user, "llm_settings:manage");
  return llmStatusFromConfig(await resolveLlmConfig(database, user.id));
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
  const finalHtml = renderPdfHtml({
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
  let pdf: Buffer;
  try {
    pdf = await renderHtmlToPdf(finalHtml);
  } catch {
    throw new AppError(500, "PDF export failed while rendering HTML.");
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

export function renderReportTemplate(template: string, context: ReportContext) {
  const unresolved = new Set<string>();
  const markdown = template.replace(/{{\s*([^}]+?)\s*}}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();
    const value = resolvePlaceholder(key, context);
    if (value === undefined || value === null) {
      unresolved.add(key);
      return `{{${key}}}`;
    }
    return String(value);
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

function resolvePlaceholder(key: string, context: ReportContext): unknown {
  const activityValue = resolveActivityPlaceholder(key, context);
  if (activityValue !== undefined) {
    return activityValue;
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

  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, context);
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
    return undefined;
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

function cell(value: unknown) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
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
  return createHash("sha256").update(process.env.FORENOTES_LLM_SECRET_KEY ?? "forenotes-development-llm-key").digest();
}

function maskApiKey(value: string) {
  return value.length <= 8 ? "****" : `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function readLlmSettings(database: Database, userId: string) {
  const result = await database.query("select * from llm_settings where user_id = $1", [userId]);
  if (result.rowCount === 0) {
    return null;
  }
  const row = result.rows[0];
  return {
    provider: String(row.provider_name),
    baseUrl: row.base_url ? String(row.base_url) : null,
    serviceUrl: resolveLiteLlmServiceUrl(),
    model: String(row.model),
    apiKey: decryptSecret(String(row.encrypted_api_key)),
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
    throw new AppError(400, "LLM is not configured. Add provider settings or set LLM_API_KEY and LLM_MODEL.");
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

async function resolveLlmConfig(database: Database, userId: string): Promise<LlmProviderConfig | null> {
  const userSettings = await readLlmSettings(database, userId);
  if (userSettings) {
    return userSettings;
  }

  const apiKey = process.env.LLM_API_KEY?.trim();
  const provider = process.env.LLM_PROVIDER?.trim() || "litellm";
  const model = process.env.LLM_MODEL?.trim();
  const baseUrl = process.env.LLM_API_ENDPOINT?.trim() || null;
  if (!model) {
    return null;
  }

  return {
    provider,
    baseUrl,
    serviceUrl: resolveLiteLlmServiceUrl(),
    model,
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
    endpointConfigured: config.endpointConfigured,
    apiKeyConfigured: Boolean(config.apiKey),
    customHeadersConfigured: Object.keys(config.customHeaders).length > 0,
    customHeaders: Object.keys(config.customHeaders).sort().map((name) => ({ name, configured: true }))
  };
}

function toLiteLlmServiceConfig(config: LlmProviderConfig): LiteLlmServiceConfig {
  return {
    serviceUrl: config.serviceUrl,
    model: config.model,
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
    if (isSafeHeaderName(name) && typeof headerValue === "string") {
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

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}
