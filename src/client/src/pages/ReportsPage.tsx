import { useState } from "react";
import { Link } from "react-router";
import { Download } from "lucide-react";
import type { IncidentReport } from "@shared/reportTypes";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { GenerateReportWorkspace } from "@/components/reports/GenerateReportWorkspace";
import { MarkdownTemplateWorkspace } from "@/components/reports/MarkdownTemplateWorkspace";
import { PdfTemplateWorkspace } from "@/components/reports/PdfTemplateWorkspace";
import { SavedReportsWorkspace } from "@/components/reports/SavedReportsWorkspace";
import { TemplateGuideWorkspace } from "@/components/reports/TemplateGuideWorkspace";
import { ScopeGate } from "@/components/shared/ScopeGate";
import { useExportReportPdf, useLlmSettings, usePdfTemplates, useReportTemplates, useReports } from "@/hooks/use-entities";
import { useTimezone } from "@/providers/TimezoneProvider";
import { useScopeStore } from "@/stores/scope-store";

type ReportsTab = "generate" | "saved" | "markdownTemplates" | "pdfTemplates" | "templateGuide";

const REPORT_TABS: Array<{ value: ReportsTab; label: string }> = [
  { value: "generate", label: "Generate Report" },
  { value: "saved", label: "Saved Reports" },
  { value: "markdownTemplates", label: "Markdown Templates" },
  { value: "pdfTemplates", label: "PDF Templates" },
  { value: "templateGuide", label: "Template Guide" },
];

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ReportsPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { timezone } = useTimezone();
  const templatesQuery = useReportTemplates();
  const reportsQuery = useReports();
  const llmQuery = useLlmSettings();
  const pdfTemplatesQuery = usePdfTemplates();
  const exportPdf = useExportReportPdf();
  const [activeTab, setActiveTab] = useState<ReportsTab>("generate");
  const [openedReportRequest, setOpenedReportRequest] = useState<{ report: IncidentReport; token: number } | null>(null);
  const [exportTarget, setExportTarget] = useState<IncidentReport | null>(null);
  const [exportTemplateId, setExportTemplateId] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);

  const templates = templatesQuery.data?.templates ?? [];
  const reports = reportsQuery.data?.reports ?? [];
  const pdfTemplates = pdfTemplatesQuery.data?.templates ?? [];
  const llmStatus = llmQuery.data;

  if (!incidentId) {
    return <ScopeGate required="incident" />;
  }

  function openSavedReport(report: IncidentReport) {
    setOpenedReportRequest({ report, token: Date.now() });
    setActiveTab("generate");
  }

  function requestExport(report: IncidentReport) {
    setExportTarget(report);
    setExportTemplateId(pdfTemplates.find((template) => template.isDefault)?.id ?? "");
    setExportError(null);
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
    <div className="reports-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Reports</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Generate reports, manage templates, and export branded PDFs.</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2" data-report-toolbar>
          <span className="min-w-0 max-w-full truncate rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
            {llmStatus?.configured ? `LLM configured: ${llmStatus.model} (${llmStatus.source})` : "LLM not configured"}
          </span>
          {!llmStatus?.configured ? (
            <Link to="/settings" className="text-xs font-medium text-[var(--color-primary)] underline-offset-4 hover:underline">
              Settings
            </Link>
          ) : null}
        </div>
      </div>

      <div className="reports-tab-bar" role="tablist" aria-label="Reports workflows">
        {REPORT_TABS.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant={activeTab === tab.value ? "secondary" : "ghost"}
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className="reports-tab-trigger"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "generate" ? (
        <GenerateReportWorkspace
          incidentId={incidentId}
          timezone={timezone}
          templates={templates}
          llmStatus={llmStatus}
          pdfTemplates={pdfTemplates}
          openedReportRequest={openedReportRequest}
          onRequestExport={requestExport}
        />
      ) : null}

      {activeTab === "saved" ? (
        <SavedReportsWorkspace reports={reports} templates={templates} onOpenReport={openSavedReport} onRequestExport={requestExport} />
      ) : null}

      {activeTab === "markdownTemplates" ? <MarkdownTemplateWorkspace incidentId={incidentId} templates={templates} /> : null}

      {activeTab === "pdfTemplates" ? <PdfTemplateWorkspace /> : null}

      {activeTab === "templateGuide" ? <TemplateGuideWorkspace /> : null}

      <Dialog
        open={Boolean(exportTarget)}
        onOpenChange={(open) => {
          if (!open) setExportTarget(null);
        }}
      >
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
                    {template.name}
                    {template.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </Select>
            </label>
            {exportError ? (
              <p className="rounded border border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
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
