import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Copy, Download, FileText, Plus, Save, Trash2, Wand2 } from "lucide-react";
import type { IncidentReport, ReportTemplate } from "@shared/reportTypes";
import { Button } from "@/components/ui/Button";
import { PdfTemplateWorkspace } from "@/components/reports/PdfTemplateWorkspace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  useCreateReport,
  useCreateReportTemplate,
  useDeleteReport,
  useDeleteReportTemplate,
  useDuplicateReportTemplate,
  useExportReportPdf,
  useGenerateReport,
  useLlmSettings,
  usePdfTemplates,
  useReportTemplates,
  useReports,
  useUpdateReport,
  useUpdateReportTemplate,
} from "@/hooks/use-entities";
import { useTimezone } from "@/providers/TimezoneProvider";
import { useScopeStore } from "@/stores/scope-store";

const DEFAULT_TEMPLATE = `# Executive Summary

{{incident.summary}}

## Incident Snapshot

- Incident: {{incident.name}}
- Client: {{incident.clientName}}
- Status: {{incident.status}}
- Start date: {{incident.startDate}}
- End date: {{incident.endDate}}
- Generated: {{generatedAt}}

## Findings Snapshot
{{findings.table}}

## Timeline of Key Events
{{timeline.table}}

## Response Tasks
{{tasks.table}}

## Analyst Notes
{{notes.list}}
`;

const EXAMPLE_TEMPLATE = `# {{incident.name}} Daily Report

Client: {{incident.clientName}}
Generated: {{generatedAt}}

## New Findings
{{activity.findingsCreated.table}}

## Updated Tasks
{{activity.tasksUpdated.table}}

## Notes
{{notes.list}}
`;

const GUIDE_SECTIONS = [
  {
    title: "Common",
    variables: ["{{incident.name}}", "{{incident.clientName}}", "{{incident.status}}", "{{incident.summary}}", "{{generatedAt}}"],
  },
  {
    title: "Incident",
    variables: [
      "{{incident.name}}",
      "{{incident.clientName}}",
      "{{incident.status}}",
      "{{incident.startDate}}",
      "{{incident.endDate}}",
      "{{incident.summary}}",
    ],
  },
  { title: "Findings", variables: ["{{findings.table}}", "{{findings.list}}", "{{findings.count}}"] },
  { title: "Timeline", variables: ["{{timeline.table}}", "{{timeline.list}}", "{{timeline.count}}"] },
  { title: "Tasks", variables: ["{{tasks.table}}", "{{tasks.list}}", "{{tasks.count}}"] },
  { title: "Notes", variables: ["{{notes.list}}", "{{notes.count}}"] },
  { title: "Tags", variables: ["{{tags.list}}", "{{tags.count}}"] },
  { title: "MITRE", variables: ["{{mitre.table}}", "{{mitre.list}}", "{{mitre.count}}"] },
  {
    title: "Entities and Links",
    variables: [
      "{{entities.table}}",
      "{{entities.list}}",
      "{{entities.count}}",
      "{{links.table}}",
      "{{links.list}}",
      "{{links.count}}",
    ],
  },
  {
    title: "Daily Report Activity",
    description: "Only available for daily reports.",
    variables: [
      "{{activity.findingsCreated.table}}",
      "{{activity.findingsUpdated.table}}",
      "{{activity.timelineCreated.table}}",
      "{{activity.timelineUpdated.table}}",
      "{{activity.tasksCreated.table}}",
      "{{activity.tasksUpdated.table}}",
      "{{activity.notesCreated.list}}",
      "{{activity.notesUpdated.list}}",
      "{{activity.linksCreated.list}}",
    ],
  },
];

type CenterTab = "editor" | "guide" | "pdf";

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function TemplateGuide() {
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  async function copyVariable(variable: string) {
    const copied = await copyTextToClipboard(variable);
    if (!copied) return;
    setCopiedVariable(variable);
    window.setTimeout(() => {
      setCopiedVariable((currentValue) => (currentValue === variable ? null : currentValue));
    }, 1500);
  }

  return (
    <div className="space-y-5" data-report-template-guide>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Template Guide</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Use double curly braces to insert report data. Unresolved variables stay visible in preview and export so mistakes are easy to spot.
        </p>
      </div>

      <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3">
        <p className="mb-2 text-sm font-medium">Example template</p>
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-[var(--color-text-muted)]">{EXAMPLE_TEMPLATE}</pre>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {GUIDE_SECTIONS.map((section) => (
          <section key={section.title} className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <div className="mb-2">
              <h4 className="text-sm font-semibold">{section.title}</h4>
              {section.description ? <p className="text-xs text-[var(--color-text-muted)]">{section.description}</p> : null}
            </div>
            <div className="space-y-1">
              {section.variables.map((variable) => (
                <div key={`${section.title}-${variable}`} className="flex items-center justify-between gap-2 rounded border border-[var(--color-border)] px-2 py-1">
                  <code className="min-w-0 truncate text-xs">{variable}</code>
                  <Button
                    type="button"
                    variant={copiedVariable === variable ? "secondary" : "ghost"}
                    size="sm"
                    title={`Copy ${variable}`}
                    aria-label={`Copy ${variable}`}
                    onClick={() => {
                      void copyVariable(variable);
                    }}
                    className="shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedVariable === variable ? "Copied" : "Copy"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { timezone } = useTimezone();
  const templatesQuery = useReportTemplates();
  const reportsQuery = useReports();
  const llmQuery = useLlmSettings();
  const pdfTemplatesQuery = usePdfTemplates();
  const createTemplate = useCreateReportTemplate();
  const updateTemplate = useUpdateReportTemplate();
  const duplicateTemplate = useDuplicateReportTemplate();
  const deleteTemplate = useDeleteReportTemplate();
  const generateReport = useGenerateReport();
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const exportPdf = useExportReportPdf();

  const templates = templatesQuery.data?.templates ?? [];
  const reports = reportsQuery.data?.reports ?? [];
  const [templateDraft, setTemplateDraft] = useState<ReportTemplate | null>(null);
  const [reportDraft, setReportDraft] = useState<IncidentReport | null>(null);
  const [preview, setPreview] = useState<Parameters<typeof createReport.mutate>[0] | null>(null);
  const [generateForm, setGenerateForm] = useState({
    templateId: "",
    date: new Date().toISOString().slice(0, 10),
    useLlm: false,
  });
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [centerTab, setCenterTab] = useState<CenterTab>("editor");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [exportTarget, setExportTarget] = useState<IncidentReport | null>(null);
  const [exportTemplateId, setExportTemplateId] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === generateForm.templateId),
    [generateForm.templateId, templates]
  );
  const activeTemplate = selectedTemplate ?? templates[0];
  const gridTemplateColumns = `${leftCollapsed ? "44px" : "minmax(230px, 290px)"} minmax(0, 1fr) ${
    rightCollapsed ? "44px" : "minmax(240px, 310px)"
  }`;
  const llmStatus = llmQuery.data;
  const pdfTemplates = pdfTemplatesQuery.data?.templates ?? [];

  if (!incidentId) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Select an incident to work with reports.</p>;
  }

  function startNewTemplate() {
    setTemplateDraft({
      id: "",
      incidentId,
      name: "Incident executive report",
      reportType: "incident",
      content: DEFAULT_TEMPLATE,
      createdByUserId: "",
      createdAt: "",
      updatedAt: "",
    });
    setPreview(null);
    setReportDraft(null);
    setCenterTab("editor");
  }

  function editTemplate(template: ReportTemplate) {
    setTemplateDraft(template);
    setPreview(null);
    setReportDraft(null);
    setCenterTab("editor");
  }

  function editReport(report: IncidentReport) {
    setReportDraft(report);
    setTemplateDraft(null);
    setPreview(null);
    setCenterTab("editor");
  }

  function saveTemplate() {
    if (!templateDraft) return;
    const payload = {
      name: templateDraft.name,
      reportType: templateDraft.reportType,
      content: templateDraft.content,
    };
    if (templateDraft.id) {
      updateTemplate.mutate({ templateId: templateDraft.id, data: payload }, { onSuccess: () => setTemplateDraft(null) });
    } else {
      createTemplate.mutate(payload, {
        onSuccess: (result) => {
          setGenerateForm((value) => ({ ...value, templateId: result.template.id }));
          setTemplateDraft(null);
        },
      });
    }
  }

  function runGenerate() {
    const targetTemplate = activeTemplate;
    if (!targetTemplate) {
      setGenerationError("Create a template before generating a report.");
      return;
    }
    if (generateForm.useLlm && llmStatus && !llmStatus.configured) {
      setGenerationError("LLM is not configured. Open Settings or set LLM_PROVIDER, LLM_MODEL, and LLM_API_KEY.");
      return;
    }
    setGenerationError(null);
    generateReport.mutate(
      {
        templateId: targetTemplate.id,
        reportType: targetTemplate.reportType,
        date: targetTemplate.reportType === "daily" ? generateForm.date : undefined,
        timezone: targetTemplate.reportType === "daily" ? timezone : undefined,
        useLlm: generateForm.useLlm,
      },
      {
        onSuccess: (result) => {
          setPreview(result.preview);
          setTemplateDraft(null);
          setReportDraft(null);
          setCenterTab("editor");
        },
        onError: (error) => setGenerationError(messageFromError(error, "Unable to generate report preview.")),
      }
    );
  }

  function savePreview() {
    if (!preview) return;
    createReport.mutate(preview, { onSuccess: () => setPreview(null) });
  }

  function saveReportDraft() {
    if (!reportDraft) return;
    updateReport.mutate(
      {
        reportId: reportDraft.id,
        data: { title: reportDraft.title, markdown: reportDraft.markdown },
      },
      { onSuccess: () => setReportDraft(null) }
    );
  }

  function runExportPdf() {
    if (!exportTarget) return;
    setExportError(null);
    exportPdf.mutate(
      { reportId: exportTarget.id, pdfTemplateId: exportTemplateId || undefined },
      {
        onSuccess: () => setExportTarget(null),
        onError: (error) => setExportError(messageFromError(error, "PDF export failed.")),
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Reports</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Incident templates, generated reports, and provider-assisted drafts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2" data-report-toolbar>
          <span className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
            {llmStatus?.configured ? `LLM configured: ${llmStatus.model} (${llmStatus.source})` : "LLM not configured"}
          </span>
          {!llmStatus?.configured ? (
            <Link to="/settings" className="text-xs font-medium text-[var(--color-primary)] underline-offset-4 hover:underline">
              Settings
            </Link>
          ) : null}
          <Button type="button" variant="outline" onClick={startNewTemplate}>
            <Plus className="h-4 w-4" />
            Template
          </Button>
          <Button type="button" onClick={runGenerate} disabled={templates.length === 0 || generateReport.isPending}>
            <Wand2 className="h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4" style={{ gridTemplateColumns }} data-reports-grid>
        {leftCollapsed ? (
          <section className="self-start rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-1" data-reports-pane="templates-collapsed">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Expand templates pane"
              aria-label="Expand templates pane"
              onClick={() => setLeftCollapsed(false)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </section>
        ) : (
          <section className="self-start rounded border border-[var(--color-border)] bg-[var(--color-surface)]" data-reports-pane="templates">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2">
              <h3 className="text-sm font-semibold">Templates</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Collapse templates pane"
                aria-label="Collapse templates pane"
                onClick={() => setLeftCollapsed(true)}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 p-3">
              {templates.length === 0 ? (
                <div className="rounded border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
                  No report templates yet.
                </div>
              ) : (
                templates.map((template) => (
                  <article key={template.id} className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" className="min-w-0 text-left" onClick={() => editTemplate(template)}>
                        <p className="truncate text-sm font-medium">{template.name}</p>
                        <p className="text-xs uppercase text-[var(--color-text-muted)]">{template.reportType}</p>
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Duplicate template"
                          onClick={() => duplicateTemplate.mutate({ templateId: template.id })}
                          className="h-8 w-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Delete template"
                          onClick={() => deleteTemplate.mutate(template.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        <section className="min-w-0 self-start rounded border border-[var(--color-border)] bg-[var(--color-surface)]" data-reports-pane="center">
          <div className="space-y-3 border-b border-[var(--color-border)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Report Workspace</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Generate previews, edit Markdown, and use the guide while authoring templates.</p>
              </div>
              <div className="flex gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] p-1">
                <Button
                  type="button"
                  variant={centerTab === "editor" ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={centerTab === "editor"}
                  onClick={() => setCenterTab("editor")}
                >
                  Editor
                </Button>
                <Button
                  type="button"
                  variant={centerTab === "guide" ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={centerTab === "guide"}
                  onClick={() => setCenterTab("guide")}
                >
                  Template Guide
                </Button>
                <Button
                  type="button"
                  variant={centerTab === "pdf" ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={centerTab === "pdf"}
                  onClick={() => setCenterTab("pdf")}
                >
                  PDF Templates
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_120px_auto]">
              <Select
                value={activeTemplate?.id ?? ""}
                onChange={(event) => setGenerateForm((value) => ({ ...value, templateId: event.target.value }))}
                aria-label="Report template"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </Select>
              <Input
                type="date"
                value={generateForm.date}
                onChange={(event) => setGenerateForm((value) => ({ ...value, date: event.target.value }))}
                aria-label="Daily report date"
                disabled={activeTemplate?.reportType === "incident"}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={generateForm.useLlm}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setGenerateForm((value) => ({ ...value, useLlm: checked }));
                    if (checked && llmStatus && !llmStatus.configured) {
                      setGenerationError("LLM is not configured. Open Settings or set LLM_PROVIDER, LLM_MODEL, and LLM_API_KEY.");
                    }
                  }}
                />
                Use LLM
              </label>
              <Button type="button" onClick={runGenerate} disabled={templates.length === 0 || generateReport.isPending}>
                <Wand2 className="h-4 w-4" />
                Preview
              </Button>
            </div>

            {generationError ? (
              <p className="rounded border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                {generationError}{" "}
                <Link to="/settings" className="font-medium underline underline-offset-4">
                  Open Settings
                </Link>
              </p>
            ) : null}
          </div>

          <div className="p-4">
            {centerTab === "guide" ? (
              <TemplateGuide />
            ) : centerTab === "pdf" ? (
              <PdfTemplateWorkspace />
            ) : (
              <div className="space-y-4">
                {templateDraft ? (
                  <section className="space-y-3" data-report-editor="template">
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                      <Input value={templateDraft.name} onChange={(event) => setTemplateDraft({ ...templateDraft, name: event.target.value })} />
                      <Select
                        value={templateDraft.reportType}
                        onChange={(event) => setTemplateDraft({ ...templateDraft, reportType: event.target.value as "daily" | "incident" })}
                      >
                        <option value="daily">Daily</option>
                        <option value="incident">Incident</option>
                      </Select>
                      <Button type="button" onClick={saveTemplate} disabled={createTemplate.isPending || updateTemplate.isPending}>
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                    </div>
                    <MarkdownEditor
                      value={templateDraft.content}
                      onChange={(content) => setTemplateDraft({ ...templateDraft, content })}
                      helperText="Placeholders are preserved for report rendering."
                    />
                  </section>
                ) : null}

                {preview ? (
                  <section className="space-y-3" data-report-editor="preview">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Input value={preview.title} onChange={(event) => setPreview({ ...preview, title: event.target.value })} />
                      <Button type="button" onClick={savePreview} disabled={createReport.isPending}>
                        <Save className="h-4 w-4" />
                        Save report
                      </Button>
                    </div>
                    {preview.unresolvedPlaceholders?.length ? (
                      <p className="text-sm text-[var(--color-danger)]">Unresolved: {preview.unresolvedPlaceholders.join(", ")}</p>
                    ) : null}
                    <MarkdownEditor
                      value={preview.markdown}
                      onChange={(markdown) => setPreview({ ...preview, markdown })}
                      helperText="Preview edits are saved only when you save the report."
                    />
                  </section>
                ) : null}

                {reportDraft ? (
                  <section className="space-y-3" data-report-editor="saved-report">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Input value={reportDraft.title} onChange={(event) => setReportDraft({ ...reportDraft, title: event.target.value })} />
                      <Button type="button" onClick={saveReportDraft} disabled={updateReport.isPending}>
                        <Save className="h-4 w-4" />
                        Save changes
                      </Button>
                    </div>
                    <MarkdownEditor
                      value={reportDraft.markdown}
                      onChange={(markdown) => setReportDraft({ ...reportDraft, markdown })}
                      helperText="Saved report content can be exported as PDF."
                    />
                  </section>
                ) : null}

                {!templateDraft && !preview && !reportDraft ? (
                  <div className="rounded border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
                    Select a template, create one, or generate a report preview.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {rightCollapsed ? (
          <section className="self-start rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-1" data-reports-pane="generated-collapsed">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Expand generated reports pane"
              aria-label="Expand generated reports pane"
              onClick={() => setRightCollapsed(false)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </section>
        ) : (
          <section className="self-start rounded border border-[var(--color-border)] bg-[var(--color-surface)]" data-reports-pane="generated">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2">
              <h3 className="text-sm font-semibold">Generated Reports</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Collapse generated reports pane"
                aria-label="Collapse generated reports pane"
                onClick={() => setRightCollapsed(true)}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 p-3">
              {reports.length === 0 ? (
                <div className="rounded border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
                  No generated reports yet.
                </div>
              ) : (
                reports.map((report) => (
                  <article key={report.id} className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                    <button type="button" className="flex w-full items-start gap-2 text-left" onClick={() => editReport(report)}>
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{report.title}</span>
                        <span className="block text-xs uppercase text-[var(--color-text-muted)]">{report.reportType} / {report.generationMode}</span>
                      </span>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExportTarget(report);
                          setExportTemplateId(pdfTemplates.find((template) => template.isDefault)?.id ?? "");
                          setExportError(null);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => deleteReport.mutate(report.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      <Dialog open={Boolean(exportTarget)} onOpenChange={(open) => {
        if (!open) setExportTarget(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export PDF</DialogTitle>
            <DialogDescription>Select a PDF theme template for this download.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="space-y-1 text-sm font-medium">
              PDF Template
              <Select value={exportTemplateId} onChange={(event) => setExportTemplateId(event.target.value)}>
                <option value="">Built-in default</option>
                {pdfTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}{template.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </Select>
            </label>
            {exportError ? (
              <p className="rounded border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                {exportError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setExportTarget(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={runExportPdf} disabled={exportPdf.isPending}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
