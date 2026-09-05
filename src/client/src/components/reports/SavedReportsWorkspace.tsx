import { useMemo, useState } from "react";
import { Copy, Download, FileText, Trash2 } from "lucide-react";
import type { IncidentReport, ReportTemplate } from "@shared/reportTypes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateReport, useDeleteReport } from "@/hooks/use-entities";

interface SavedReportsWorkspaceProps {
  reports: IncidentReport[];
  templates: ReportTemplate[];
  onOpenReport: (report: IncidentReport) => void;
  onRequestExport: (report: IncidentReport) => void;
}

type SortMode = "updatedDesc" | "createdDesc" | "titleAsc";

export function SavedReportsWorkspace({ reports, templates, onOpenReport, onRequestExport }: SavedReportsWorkspaceProps) {
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("updatedDesc");

  const templateNames = useMemo(
    () => new Map(templates.map((template) => [template.id, template.name])),
    [templates]
  );

  const filteredReports = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const nextReports = reports.filter((report) => {
      const templateName = report.templateId ? templateNames.get(report.templateId) ?? "" : "";
      const matchesSearch =
        !normalizedSearch ||
        report.title.toLowerCase().includes(normalizedSearch) ||
        report.incidentId.toLowerCase().includes(normalizedSearch) ||
        templateName.toLowerCase().includes(normalizedSearch);
      const matchesTemplate = templateFilter === "all" || report.templateId === templateFilter;
      return matchesSearch && matchesTemplate;
    });

    return [...nextReports].sort((a, b) => {
      if (sortMode === "titleAsc") return a.title.localeCompare(b.title);
      if (sortMode === "createdDesc") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
  }, [reports, search, sortMode, templateFilter, templateNames]);

  function duplicateReport(report: IncidentReport) {
    createReport.mutate({
      templateId: report.templateId ?? undefined,
      title: `Copy of ${report.title}`,
      reportType: report.reportType,
      reportDate: report.reportDate,
      timezone: report.timezone,
      markdown: report.markdown,
      generationMode: report.generationMode,
      generatedContext: report.generatedContext,
      unresolvedPlaceholders: report.unresolvedPlaceholders,
    });
  }

  return (
    <section className="reports-workspace space-y-4" data-saved-reports-workspace>
      <div className="reports-card rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
          <label className="space-y-1 text-sm font-medium">
            Search
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, template, or incident" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Template
            <Select value={templateFilter} onChange={(event) => setTemplateFilter(event.target.value)}>
              <option value="all">All templates</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm font-medium">
            Sort
            <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="updatedDesc">Updated newest</option>
              <option value="createdDesc">Created newest</option>
              <option value="titleAsc">Title A-Z</option>
            </Select>
          </label>
        </div>
      </div>

      <div className="reports-card overflow-hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_130px_130px_260px] gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-xs font-semibold uppercase text-[var(--color-text-muted)] xl:grid">
          <span>Title</span>
          <span>Incident</span>
          <span>Template</span>
          <span>Created</span>
          <span>Updated</span>
          <span>Actions</span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No saved reports match the current filters.</div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {filteredReports.map((report) => {
              const templateName = report.templateId ? templateNames.get(report.templateId) ?? "Unknown template" : "No template";
              return (
                <article
                  key={report.id}
                  className="grid gap-3 px-4 py-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_130px_130px_260px] xl:items-center"
                >
                  <button type="button" className="flex min-w-0 items-start gap-2 text-left" onClick={() => onOpenReport(report)}>
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{report.title}</span>
                      <span className="block text-xs uppercase text-[var(--color-text-muted)]">
                        {report.reportType} / {report.generationMode}
                      </span>
                    </span>
                  </button>
                  <div className="min-w-0 text-sm text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text)] xl:hidden">Incident: </span>
                    <span className="break-all">{report.incidentId}</span>
                  </div>
                  <div className="min-w-0 text-sm text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text)] xl:hidden">Template: </span>
                    <span>{templateName}</span>
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text)] xl:hidden">Created: </span>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text)] xl:hidden">Updated: </span>
                    {new Date(report.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => onOpenReport(report)}>
                      Open
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => onRequestExport(report)}>
                      <Download className="h-4 w-4" />
                      HTML
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => duplicateReport(report)} disabled={createReport.isPending}>
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => deleteReport.mutate(report.id)} disabled={deleteReport.isPending}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
