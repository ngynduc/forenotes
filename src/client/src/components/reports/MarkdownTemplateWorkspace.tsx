import { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Save, Trash2 } from "lucide-react";
import type { ReportTemplate } from "@shared/reportTypes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { api } from "@/lib/api";
import { renderMarkdownTable } from "@/lib/reports/renderMarkdownTable";
import { renderReportValue } from "@/lib/reports/renderReportValue";
import {
  useCreateReportTemplate,
  useDeleteReportTemplate,
  useDuplicateReportTemplate,
  useUpdateReportTemplate,
} from "@/hooks/use-entities";

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

const SAMPLE_CONTEXT: Record<string, unknown> = {
  generatedAt: "2026-07-03T10:30:00.000Z",
  reportType: "incident",
  date: "2026-07-03",
  timezone: "Asia/Ho_Chi_Minh",
  incident: {
    name: "Acme intrusion response",
    summary: "Initial triage confirmed suspicious repository access and follow-up containment tasks.",
    status: "open",
    clientName: "Acme Corp",
    caseName: "Acme IR-2026-07",
    startDate: "2026-07-01",
    endDate: null,
  },
  findings: [
    { title: "Privileged clone spike", severity: "high", status: "open", description: "Repository cloning exceeded baseline." },
    { title: "Unusual admin login", severity: "medium", status: "confirmed", description: "Admin login from an unfamiliar ASN." },
  ],
  timeline: [
    { eventTime: "2026-07-03 08:15", title: "Alert received", source: "SIEM" },
    { eventTime: "2026-07-03 08:42", title: "Repository access reviewed", source: "Git audit" },
  ],
  tasks: [
    { title: "Disable stale tokens", status: "in_progress", priority: "high" },
    { title: "Collect workstation image", status: "todo", priority: "medium" },
  ],
  notes: ["Escalated to client security lead.", "Awaiting VPN logs for the affected user."],
  case: { name: "Acme IR-2026-07" },
  client: { name: "Acme Corp" },
};

interface MarkdownTemplateWorkspaceProps {
  incidentId: string;
  templates: ReportTemplate[];
}

function newTemplateDraft(incidentId: string): ReportTemplate {
  return {
    id: "",
    incidentId,
    name: "Incident executive report",
    reportType: "incident",
    content: DEFAULT_TEMPLATE,
    createdByUserId: "",
    createdAt: "",
    updatedAt: "",
  };
}

function resolvePreviewValue(key: string) {
  const parts = key.split(".");
  const modifier = parts.at(-1);
  const hasStructuredModifier = modifier === "table" || modifier === "list" || modifier === "count" || modifier === "json";
  const baseParts = hasStructuredModifier ? parts.slice(0, -1) : parts;
  const baseValue = baseParts.reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, SAMPLE_CONTEXT);

  if (baseValue === undefined) {
    return undefined;
  }
  if (!hasStructuredModifier) {
    return renderReportValue(baseValue);
  }
  if (modifier === "count") {
    return Array.isArray(baseValue) ? String(baseValue.length) : baseValue ? "1" : "0";
  }
  if (modifier === "json") {
    return `\`\`\`json\n${JSON.stringify(baseValue, null, 2)}\n\`\`\``;
  }
  if (modifier === "table") {
    return Array.isArray(baseValue) && baseValue.every((item) => item && typeof item === "object" && !Array.isArray(item))
      ? renderMarkdownTable(baseValue as Record<string, unknown>[])
      : renderReportValue(baseValue);
  }
  if (Array.isArray(baseValue)) {
    return baseValue.map((item) => `- ${typeof item === "object" ? JSON.stringify(item) : String(item)}`).join("\n") || "Not provided";
  }
  return renderReportValue(baseValue);
}

function renderTemplatePreview(template: string) {
  return template.replace(/{{\s*([^}]+?)\s*}}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();
    const value = resolvePreviewValue(key);
    return value === undefined ? `{{${key}}}` : value;
  });
}

export function MarkdownTemplateWorkspace({ incidentId, templates }: MarkdownTemplateWorkspaceProps) {
  const createTemplate = useCreateReportTemplate();
  const updateTemplate = useUpdateReportTemplate();
  const duplicateTemplate = useDuplicateReportTemplate();
  const deleteTemplate = useDeleteReportTemplate();
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [draft, setDraft] = useState<ReportTemplate>(() => newTemplateDraft(incidentId));

  useEffect(() => {
    if (selectedTemplateId && templates.some((template) => template.id === selectedTemplateId)) {
      return;
    }
    if (templates[0]) {
      setSelectedTemplateId(templates[0].id);
      setDraft(templates[0]);
    }
  }, [selectedTemplateId, templates]);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return templates;
    return templates.filter((template) => template.name.toLowerCase().includes(normalizedSearch) || template.reportType.includes(normalizedSearch));
  }, [search, templates]);
  const samplePreview = useMemo(() => renderTemplatePreview(draft.content), [draft.content]);

  function uploadReportImage(file: File) {
    return api.uploadReportImage(incidentId, file);
  }

  function selectTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((candidate) => candidate.id === templateId);
    if (template) {
      setDraft(template);
    }
  }

  function createNewTemplate() {
    setSelectedTemplateId("");
    setDraft(newTemplateDraft(incidentId));
  }

  function saveTemplate() {
    const payload = {
      name: draft.name,
      reportType: draft.reportType,
      content: draft.content,
    };
    if (draft.id) {
      updateTemplate.mutate({ templateId: draft.id, data: payload }, { onSuccess: (result) => setDraft(result.template) });
      return;
    }
    createTemplate.mutate(payload, {
      onSuccess: (result) => {
        setSelectedTemplateId(result.template.id);
        setDraft(result.template);
      },
    });
  }

  return (
    <section className="reports-workspace space-y-4" data-markdown-template-workspace>
      <div className="reports-card rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,340px)_auto]">
          <label className="space-y-1 text-sm font-medium">
            Search templates
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Markdown templates" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Selected template
            <Select value={selectedTemplateId} onChange={(event) => selectTemplate(event.target.value)}>
              <option value="">New unsaved template</option>
              {filteredTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={createNewTemplate} className="w-full">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]">
        <section className="reports-card min-w-0 space-y-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <label className="space-y-1 text-sm font-medium">
              Template name
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Report type
              <Select value={draft.reportType} onChange={(event) => setDraft({ ...draft, reportType: event.target.value as "daily" | "incident" })}>
                <option value="incident">Incident</option>
                <option value="daily">Daily</option>
              </Select>
            </label>
          </div>

          <MarkdownEditor
            value={draft.content}
            onChange={(content) => setDraft({ ...draft, content })}
            onUploadImage={uploadReportImage}
            helperText="Placeholders are resolved during report generation; unresolved placeholders remain visible."
          />

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={saveTemplate} disabled={createTemplate.isPending || updateTemplate.isPending}>
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => draft.id && duplicateTemplate.mutate({ templateId: draft.id })}
              disabled={!draft.id || duplicateTemplate.isPending}
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (!draft.id) return;
                deleteTemplate.mutate(draft.id, {
                  onSuccess: () => createNewTemplate(),
                });
              }}
              disabled={!draft.id || deleteTemplate.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </section>

        <aside className="reports-card min-w-0 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="text-sm font-semibold">Variable Preview</h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">A sample incident is used to test placeholder output.</p>
          <pre className="mt-3 max-h-[620px] overflow-auto whitespace-pre-wrap rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs leading-5">
            {samplePreview}
          </pre>
        </aside>
      </div>
    </section>
  );
}
