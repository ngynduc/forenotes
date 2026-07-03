import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copyTextToClipboard } from "@/lib/clipboard";

const EXAMPLE_TEMPLATE = `# {{incident.name}} Daily Report

Client: {{incident.clientName}}
Generated: {{generatedAt}}

## Findings
{{findings.table}}

## Timeline
{{timeline.table}}

## Tasks
{{tasks.table}}`;

const GUIDE_SECTIONS = [
  {
    title: "Incident variables",
    description: "Use incident fields for the current report scope.",
    variables: ["{{incident.name}}", "{{incident.summary}}", "{{incident.status}}", "{{incident.startDate}}", "{{incident.endDate}}"],
  },
  {
    title: "Finding variables",
    description: "Findings support table, list, count, and JSON formats.",
    variables: ["{{findings.table}}", "{{findings.list}}", "{{findings.count}}", "{{findings.json}}"],
  },
  {
    title: "Timeline variables",
    description: "Timeline entries are ordered by event time.",
    variables: ["{{timeline.table}}", "{{timeline.list}}", "{{timeline.count}}", "{{timeline.json}}"],
  },
  {
    title: "Task variables",
    description: "Tasks include title, status, priority, and note content when available.",
    variables: ["{{tasks.table}}", "{{tasks.list}}", "{{tasks.count}}", "{{tasks.json}}"],
  },
  {
    title: "Case/client variables",
    description: "Case and client fields come from the selected incident's case.",
    variables: ["{{incident.caseName}}", "{{incident.clientName}}", "{{case.name}}", "{{client.name}}"],
  },
  {
    title: "Generated report variables",
    description: "Report metadata is available in Markdown report templates.",
    variables: ["{{generatedAt}}", "{{reportType}}", "{{date}}", "{{timezone}}"],
  },
  {
    title: "PDF template variables",
    description: "PDF templates wrap the rendered Markdown content in branded HTML/CSS.",
    variables: ["{{content}}", "{{page.css}}", "{{report.title}}", "{{report.type}}", "{{report.generatedAt}}"],
  },
];

export function TemplateGuideWorkspace() {
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
    <section className="reports-workspace space-y-4" data-report-template-guide>
      <div className="reports-card rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="text-base font-semibold">Template Guide</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Use double curly braces to insert report data. Structured variables can render as <code>.table</code>, <code>.list</code>,{" "}
          <code>.count</code>, or <code>.json</code>.
        </p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs">
          {EXAMPLE_TEMPLATE}
        </pre>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {GUIDE_SECTIONS.map((section) => (
          <section key={section.title} className="reports-card rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h4 className="text-sm font-semibold">{section.title}</h4>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{section.description}</p>
            <div className="mt-3 space-y-2">
              {section.variables.map((variable) => (
                <div key={variable} className="flex min-w-0 items-center justify-between gap-2 rounded border border-[var(--color-border)] px-2 py-1.5">
                  <code className="min-w-0 truncate text-xs">{variable}</code>
                  <Button
                    type="button"
                    variant={copiedVariable === variable ? "secondary" : "ghost"}
                    size="sm"
                    title={`Copy ${variable}`}
                    aria-label={`Copy ${variable}`}
                    data-report-guide-copy
                    onClick={() => {
                      void copyVariable(variable);
                    }}
                    className="shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="report-guide-copy-label">{copiedVariable === variable ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
