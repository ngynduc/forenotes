import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Download, Save, Wand2 } from "lucide-react";
import type { IncidentReport, LlmSettingsStatus, PdfTemplate, ReportTemplate } from "@shared/reportTypes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { api, type CreateReportInput } from "@/lib/api";
import { useCreateReport, useGenerateReport, useUpdateReport } from "@/hooks/use-entities";

interface OpenedReportRequest {
  report: IncidentReport;
  token: number;
}

interface GenerateReportWorkspaceProps {
  incidentId: string;
  timezone: string;
  templates: ReportTemplate[];
  llmStatus?: LlmSettingsStatus;
  pdfTemplates: PdfTemplate[];
  openedReportRequest: OpenedReportRequest | null;
  onRequestExport: (report: IncidentReport) => void;
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function GenerateReportWorkspace({
  incidentId,
  timezone,
  templates,
  llmStatus,
  pdfTemplates,
  openedReportRequest,
  onRequestExport,
}: GenerateReportWorkspaceProps) {
  const generateReport = useGenerateReport();
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();
  const [preview, setPreview] = useState<CreateReportInput | null>(null);
  const [reportDraft, setReportDraft] = useState<IncidentReport | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generateForm, setGenerateForm] = useState({
    templateId: "",
    date: new Date().toISOString().slice(0, 10),
    useLlm: false,
  });

  useEffect(() => {
    if (!generateForm.templateId && templates[0]) {
      setGenerateForm((value) => ({ ...value, templateId: templates[0].id }));
    }
  }, [generateForm.templateId, templates]);

  useEffect(() => {
    if (!openedReportRequest) return;
    setReportDraft(openedReportRequest.report);
    setPreview(null);
    setGenerationError(null);
  }, [openedReportRequest]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === generateForm.templateId) ?? templates[0],
    [generateForm.templateId, templates]
  );
  const activeTitle = preview?.title ?? reportDraft?.title ?? "";
  const defaultPdfTemplate = pdfTemplates.find((template) => template.isDefault);
  const canSave = Boolean(preview || reportDraft);
  const canExport = Boolean(reportDraft);

  function uploadReportImage(file: File) {
    return api.uploadReportImage(incidentId, file);
  }

  function runGenerate() {
    if (!selectedTemplate) {
      setGenerationError("Create a Markdown template before generating a report.");
      return;
    }
    if (generateForm.useLlm && llmStatus && !llmStatus.configured) {
      setGenerationError("LLM is not configured. Open Settings or set LLM_PROVIDER, LLM_MODEL, and LLM_API_KEY.");
      return;
    }

    setGenerationError(null);
    generateReport.mutate(
      {
        templateId: selectedTemplate.id,
        reportType: selectedTemplate.reportType,
        date: selectedTemplate.reportType === "daily" ? generateForm.date : undefined,
        timezone: selectedTemplate.reportType === "daily" ? timezone : undefined,
        useLlm: generateForm.useLlm,
      },
      {
        onSuccess: (result) => {
          setPreview(result.preview);
          setReportDraft(null);
        },
        onError: (error) => setGenerationError(messageFromError(error, "Unable to generate report preview.")),
      }
    );
  }

  function saveCurrentReport() {
    if (preview) {
      createReport.mutate(preview, {
        onSuccess: (result) => {
          setReportDraft(result.report);
          setPreview(null);
        },
      });
      return;
    }
    if (!reportDraft) return;
    updateReport.mutate(
      {
        reportId: reportDraft.id,
        data: { title: reportDraft.title, markdown: reportDraft.markdown },
      },
      {
        onSuccess: (result) => setReportDraft(result.report),
      }
    );
  }

  function updateTitle(title: string) {
    if (preview) {
      setPreview({ ...preview, title });
      return;
    }
    if (reportDraft) {
      setReportDraft({ ...reportDraft, title });
    }
  }

  function updateMarkdown(markdown: string) {
    if (preview) {
      setPreview({ ...preview, markdown });
      return;
    }
    if (reportDraft) {
      setReportDraft({ ...reportDraft, markdown });
    }
  }

  return (
    <section className="reports-workspace space-y-4" data-report-generate-workspace>
      <div className="reports-card rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_130px_auto]">
          <label className="space-y-1 text-sm font-medium">
            Template
            <Select
              value={selectedTemplate?.id ?? ""}
              onChange={(event) => setGenerateForm((value) => ({ ...value, templateId: event.target.value }))}
              aria-label="Report template"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm font-medium">
            Report date
            <Input
              type="date"
              value={generateForm.date}
              onChange={(event) => setGenerateForm((value) => ({ ...value, date: event.target.value }))}
              aria-label="Daily report date"
              disabled={selectedTemplate?.reportType === "incident"}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
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
          <div className="flex items-end">
            <Button type="button" onClick={runGenerate} disabled={templates.length === 0 || generateReport.isPending} className="w-full">
              <Wand2 className="h-4 w-4" />
              Generate Preview
            </Button>
          </div>
        </div>

        {generationError ? (
          <p className="mt-3 rounded border border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {generationError}{" "}
            <Link to="/settings" className="font-medium underline underline-offset-4">
              Open Settings
            </Link>
          </p>
        ) : null}
      </div>

      <div className="reports-card rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <label className="min-w-[220px] flex-1 space-y-1 text-sm font-medium">
            Report title
            <Input
              value={activeTitle}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="Generate or open a report to edit"
              disabled={!preview && !reportDraft}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={saveCurrentReport} disabled={!canSave || createReport.isPending || updateReport.isPending}>
              <Save className="h-4 w-4" />
              Save Report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (reportDraft) onRequestExport(reportDraft);
              }}
              disabled={!canExport}
              title={reportDraft ? `Export using ${defaultPdfTemplate?.name ?? "the built-in HTML template"}` : "Save the report before exporting"}
            >
              <Download className="h-4 w-4" />
              Export HTML
            </Button>
          </div>
        </div>

        {preview?.unresolvedPlaceholders?.length ? (
          <p className="mb-3 rounded border border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            Unresolved: {preview.unresolvedPlaceholders.join(", ")}
          </p>
        ) : null}

        {preview || reportDraft ? (
          <MarkdownEditor
            value={preview?.markdown ?? reportDraft?.markdown ?? ""}
            onChange={updateMarkdown}
            onUploadImage={uploadReportImage}
            helperText={preview ? "Preview edits are saved only when you save the report." : "Saved report content can be exported as HTML."}
          />
        ) : (
          <div className="rounded border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            Choose a template and generate a preview, or open a saved report.
          </div>
        )}
      </div>
    </section>
  );
}
