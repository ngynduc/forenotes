import { useEffect, useRef, useState } from "react";
import { FileText, Send, Square, Wrench } from "lucide-react";
import type { IncidentReport } from "@shared/reportTypes";
import { Button } from "@/components/ui/Button";
import { api, type ReportChatEvent } from "@/lib/api";
import { useCreateReport } from "@/hooks/use-entities";

interface ToolStep { id: string; name: string; args: unknown; status: "done" | "error"; summary: string }
interface ChatEntry { role: "user" | "assistant"; content: string; tools: ToolStep[] }

const SUGGESTIONS = [
  "Write an executive summary of this incident.",
  "Draft a full incident report with timeline, findings and recommendations.",
  "Summarize the high-severity findings and the evidence behind them.",
];

function titleFrom(markdown: string) {
  const heading = markdown.split("\n").find((line) => /^#\s+/.test(line));
  return heading ? heading.replace(/^#\s+/, "").trim().slice(0, 120) : `AI report ${new Date().toISOString().slice(0, 10)}`;
}

export function ReportChatWorkspace({ incidentId, llmConfigured, onOpenReport }: {
  incidentId: string;
  llmConfigured: boolean;
  onOpenReport: (report: IncidentReport) => void;
}) {
  const createReport = useCreateReport();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [entries]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { setEntries([]); setError(null); }, [incidentId]);

  // Mutates only the trailing assistant entry, which is the one being streamed.
  const patchLast = (change: (entry: ChatEntry) => ChatEntry) =>
    setEntries((current) => current.map((entry, index) => (index === current.length - 1 ? change(entry) : entry)));

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    const history = [...entries, { role: "user" as const, content, tools: [] }];
    setEntries([...history, { role: "assistant", content: "", tools: [] }]);
    setInput("");
    setError(null);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const onEvent = (event: ReportChatEvent) => {
      if (event.type === "text") patchLast((entry) => ({ ...entry, content: entry.content + event.delta }));
      else if (event.type === "tool") patchLast((entry) => ({ ...entry, tools: [...entry.tools, event] }));
      else if (event.type === "error") setError(event.message);
    };
    try {
      await api.streamReportChat(incidentId, history.map(({ role, content }) => ({ role, content })), onEvent, controller.signal);
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Report chat failed.");
    } finally {
      setStreaming(false);
      // Drop an assistant bubble that never received anything.
      setEntries((current) => current.filter((entry, index) => !(index === current.length - 1 && entry.role === "assistant" && !entry.content && !entry.tools.length)));
    }
  }

  async function saveAsReport(markdown: string) {
    setError(null);
    try {
      const generatedContext = await api.getReportContext(incidentId);
      createReport.mutate(
        { title: titleFrom(markdown), reportType: "incident", markdown, generationMode: "llm", generatedContext },
        { onSuccess: (result) => onOpenReport(result.report), onError: (caught) => setError(caught.message) }
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save report.");
    }
  }

  return (
    <section className="reports-workspace flex h-[calc(100vh-260px)] min-h-[420px] flex-col rounded border border-[var(--color-border)] bg-[var(--color-surface)]" data-report-chat-workspace>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
            <p>Ask the AI to write a report. It reads this incident's findings, timeline, tasks and indicators on demand, within your permissions.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button key={suggestion} type="button" size="sm" variant="outline" disabled={!llmConfigured} onClick={() => void send(suggestion)}>{suggestion}</Button>
              ))}
            </div>
          </div>
        ) : null}
        {entries.map((entry, index) => {
          const last = index === entries.length - 1;
          return (
            <div key={index} className={entry.role === "user" ? "ml-auto max-w-[80%]" : "max-w-full"}>
              {entry.tools.map((tool) => (
                <p key={tool.id} className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <Wrench className="h-3 w-3" />
                  <span className="font-mono">{tool.name}</span>
                  {tool.name === "query_incident_data" && typeof tool.args === "object" && tool.args ? <span>({(tool.args as { entity?: string }).entity})</span> : null}
                  <span className={tool.status === "error" ? "text-[var(--color-danger)]" : ""}>- {tool.summary}</span>
                </p>
              ))}
              {entry.content || (streaming && last) ? (
                <div className={entry.role === "user"
                  ? "rounded bg-[var(--color-primary)] px-3 py-2 text-sm text-[var(--color-primary-foreground)]"
                  : "rounded border border-[var(--color-border)] px-3 py-2 text-sm"}>
                  <pre className="whitespace-pre-wrap font-sans">{entry.content}{streaming && last && entry.role === "assistant" ? "▍" : ""}</pre>
                </div>
              ) : null}
              {entry.role === "assistant" && entry.content && !(streaming && last) ? (
                <Button type="button" size="sm" variant="ghost" className="mt-1" disabled={createReport.isPending} onClick={() => void saveAsReport(entry.content)}>
                  <FileText className="h-4 w-4" /> Save as report and edit
                </Button>
              ) : null}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {error ? <p className="mx-4 mb-2 rounded border border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p> : null}
      <form className="flex gap-2 border-t border-[var(--color-border)] p-3" onSubmit={(event) => { event.preventDefault(); void send(input); }}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(input); } }}
          rows={2}
          placeholder={llmConfigured ? "Ask for a report, a section, or a summary..." : "LLM is not configured. Open Settings first."}
          disabled={!llmConfigured}
          className="min-h-[44px] flex-1 resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        />
        {streaming ? (
          <Button type="button" variant="outline" onClick={() => abortRef.current?.abort()}><Square className="h-4 w-4" /> Stop</Button>
        ) : (
          <Button type="submit" disabled={!llmConfigured || !input.trim()}><Send className="h-4 w-4" /> Send</Button>
        )}
      </form>
    </section>
  );
}
