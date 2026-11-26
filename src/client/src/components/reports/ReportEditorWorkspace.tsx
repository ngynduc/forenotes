import { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import type { IncidentReport, PdfTemplate } from "@shared/reportTypes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { api } from "@/lib/api";
import { useUpdateReport } from "@/hooks/use-entities";

interface OpenedReportRequest {
  report: IncidentReport;
  token: number;
}

interface ReportEditorWorkspaceProps {
  incidentId: string;
  pdfTemplates: PdfTemplate[];
  openedReportRequest: OpenedReportRequest | null;
  onRequestExport: (report: IncidentReport) => void;
}

export function ReportEditorWorkspace({ incidentId, pdfTemplates, openedReportRequest, onRequestExport }: ReportEditorWorkspaceProps) {
  const updateReport = useUpdateReport();
  const [draft, setDraft] = useState<IncidentReport | null>(null);
  const [saved, setSaved] = useState<IncidentReport | null>(null);

  useEffect(() => {
    if (!openedReportRequest) return;
    setDraft(openedReportRequest.report);
    setSaved(openedReportRequest.report);
  }, [openedReportRequest]);

  const dirty = Boolean(draft && saved && (draft.title !== saved.title || draft.markdown !== saved.markdown));
  const defaultPdfTemplate = pdfTemplates.find((template) => template.isDefault);

  function save() {
    if (!draft) return;
    updateReport.mutate(
      { reportId: draft.id, data: { title: draft.title, markdown: draft.markdown } },
      { onSuccess: (result) => { setDraft(result.report); setSaved(result.report); } }
    );
  }

  return (
    <section className="reports-workspace space-y-4" data-report-editor-workspace>
      <div className="reports-card rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <label className="min-w-[220px] flex-1 space-y-1 text-sm font-medium">
            Report title
            <Input
              value={draft?.title ?? ""}
              onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
              placeholder="Open a report to edit"
              disabled={!draft}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {dirty ? <span className="text-xs text-[var(--color-text-muted)]">Unsaved changes</span> : null}
            {updateReport.isError ? <span className="text-xs text-[var(--color-danger)]">{updateReport.error.message}</span> : null}
            <Button type="button" onClick={save} disabled={!dirty || updateReport.isPending}>
              <Save className="h-4 w-4" />
              Save Report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (draft) onRequestExport(draft); }}
              disabled={!draft || dirty}
              title={dirty ? "Save your changes before exporting" : `Export using ${defaultPdfTemplate?.name ?? "the built-in HTML template"}`}
            >
              <Download className="h-4 w-4" />
              Export HTML
            </Button>
          </div>
        </div>

        {draft ? (
          <MarkdownEditor
            value={draft.markdown}
            onChange={(markdown) => setDraft((current) => (current ? { ...current, markdown } : current))}
            onUploadImage={(file) => api.uploadReportImage(incidentId, file)}
            helperText="Saved report content can be exported as HTML."
          />
        ) : (
          <div className="rounded border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            Open a saved report, or ask the AI in Report Chat and choose "Save as report and edit".
          </div>
        )}
      </div>
    </section>
  );
}
