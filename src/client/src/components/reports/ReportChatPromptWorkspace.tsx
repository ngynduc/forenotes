import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

const EXAMPLE = "Write in formal British English for a non-technical executive audience.\nUse the headings: Summary, Impact, Timeline, Findings, Recommendations.\nRefer to the client as \"Acme Corp\" and keep each section under 200 words.";

export function ReportChatPromptWorkspace() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["report-chat-prompt"], queryFn: () => api.getReportChatPrompt() });
  const [draft, setDraft] = useState("");
  const save = useMutation({
    mutationFn: (prompt: string) => api.saveReportChatPrompt(prompt),
    onSuccess: (data) => queryClient.setQueryData(["report-chat-prompt"], data),
  });

  useEffect(() => { if (query.data) setDraft(query.data.prompt); }, [query.data]);

  const dirty = draft.trim() !== (query.data?.prompt ?? "");

  return (
    <section className="reports-workspace space-y-4" data-report-chat-prompt-workspace>
      <div className="reports-card space-y-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <h3 className="text-sm font-semibold">Your report instructions</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Added to every AI Report Chat request for your account. Use it for tone, language, structure, and client naming.</p>
        </div>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={10}
          maxLength={8000}
          placeholder={EXAMPLE}
          aria-label="Report chat instructions"
          disabled={query.isLoading}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        />
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => save.mutate(draft)} disabled={!dirty || save.isPending}>
            <Save className="h-4 w-4" /> Save instructions
          </Button>
          <span className="text-xs text-[var(--color-text-muted)]">{draft.length}/8000</span>
          {save.isSuccess && !dirty ? <span className="text-xs text-[var(--color-text-muted)]">Saved. New chat messages use it.</span> : null}
          {save.isError ? <span className="text-xs text-[var(--color-danger)]">{save.error.message}</span> : null}
          {query.isError ? <span className="text-xs text-[var(--color-danger)]">Unable to load instructions.</span> : null}
        </div>
      </div>
      <div className="reports-card space-y-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="text-sm font-semibold">Built-in rules (read-only)</h3>
        <p className="text-sm text-[var(--color-text-muted)]">Always applied first. They tell the AI how to read the incident data and not to invent facts, so they can't be removed.</p>
        <pre className="whitespace-pre-wrap rounded bg-[var(--color-surface-muted)] p-3 font-sans text-sm">{query.data?.builtIn ?? "Loading..."}</pre>
      </div>
    </section>
  );
}
