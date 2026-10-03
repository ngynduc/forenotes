import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Bot, CheckCircle2, Database, FlaskConical, Network, SearchCheck } from "lucide-react";
import { ScopeGate } from "@/components/shared/ScopeGate";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { usePermissions } from "@/hooks/use-auth";
import { type InvestigationCollection, useInvestigationRecords, useUpdateInvestigationRecord } from "@/hooks/use-investigation";
import { api, type InvestigationRecord } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";

const TABS: Array<{ id: InvestigationCollection; label: string; icon: typeof Activity }> = [
  { id: "runs", label: "Runs", icon: Activity },
  { id: "evidence", label: "Evidence", icon: Database },
  { id: "observations", label: "Observations", icon: SearchCheck },
  { id: "hypotheses", label: "Hypotheses", icon: FlaskConical },
  { id: "findings", label: "Draft Findings", icon: Network },
  { id: "actions", label: "Agent Actions", icon: Bot }
];

export default function InvestigationPage() {
  const caseId = useScopeStore((state) => state.selectedCaseId);
  const incidentId = useScopeStore((state) => state.selectedIncidentId);
  const [tab, setTab] = useState<InvestigationCollection>("runs");
  const [runId, setRunId] = useState("");
  const records = useInvestigationRecords(tab, runId);
  const runs = useInvestigationRecords("runs");
  const updateRecord = useUpdateInvestigationRecord();
  const [editing, setEditing] = useState<InvestigationRecord | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const confirmFinding = useMutation({
    mutationFn: (finding: InvestigationRecord) => api.updateFinding(finding.incidentId!, finding.id, { status: "confirmed" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["investigation"] })
  });

  const runOptions = useMemo(() => runs.data?.items ?? [], [runs.data?.items]);
  if (!caseId) return <ScopeGate required="case" />;

  function openEditor(record: InvestigationRecord) {
    setEditing(record);
    setEditForm({ title: record.title ?? "", description: record.description ?? "" });
  }

  function saveEditor() {
    if (!editing || !["evidence", "observations", "hypotheses"].includes(tab)) return;
    updateRecord.mutate({ collection: tab as "evidence" | "observations" | "hypotheses", recordId: editing.id, data: editForm }, {
      onSuccess: () => setEditing(null)
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <header className="relative overflow-hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="absolute inset-y-0 right-0 w-56 bg-[linear-gradient(135deg,transparent_20%,var(--color-primary-soft)_20%,var(--color-primary-soft)_22%,transparent_22%)] opacity-60" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)]">Provenance ledger</p>
            <h2 className="mt-1 text-xl font-semibold">Investigation</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Review the agent trail from source evidence to human-confirmed findings.</p>
          </div>
          <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
            {incidentId ? "Incident filter active" : "All case records"}
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] pb-3">
        {TABS.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded px-3 py-2 text-xs font-medium transition-colors ${tab === item.id ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
            <item.icon className="h-3.5 w-3.5" /> {item.label}
          </button>
        ))}
        <select value={runId} onChange={(event) => setRunId(event.target.value)} className="ml-auto h-9 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs">
          <option value="">All runs</option>
          {runOptions.map((run) => <option key={run.id} value={run.id}>{run.objective ?? run.id}</option>)}
        </select>
      </div>

      {records.isLoading ? <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">Loading investigation records…</p> : null}
      {records.error ? <div className="rounded border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger)]">{records.error.message}</div> : null}
      {!records.isLoading && !records.error && !records.data?.items.length ? (
        <div className="rounded border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
          <Bot className="mx-auto h-6 w-6 text-[var(--color-text-muted)]" />
          <p className="mt-2 text-sm font-medium">No {TABS.find((item) => item.id === tab)?.label.toLowerCase()}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Records appear here when an authorized agent works the selected case.</p>
        </div>
      ) : null}

      <div className="grid gap-2">
        {records.data?.items.map((record) => {
          const supportCount = record.observationIds?.length ?? record.evidenceIds?.length ?? 0;
          const editable = ["evidence", "observations", "hypotheses"].includes(tab) && can("investigation:write");
          return (
            <article key={record.id} className="grid gap-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-[10rem_minmax(0,1fr)_auto] md:items-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                <p>{record.evidenceType ?? record.toolName ?? record.status ?? tab}</p>
                <p className="mt-1 normal-case tracking-normal">{record.createdAt ? new Date(record.createdAt).toLocaleString() : record.id.slice(0, 8)}</p>
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">{record.title ?? record.objective ?? record.toolName ?? record.id}</h3>
                <p className="line-clamp-2 text-xs text-[var(--color-text-muted)]">{record.description ?? record.summary ?? record.errorSummary ?? "No narrative supplied."}</p>
                {supportCount ? <p className="mt-1 text-[11px] text-[var(--color-primary)]">{supportCount} provenance link{supportCount === 1 ? "" : "s"}</p> : null}
                {tab === "findings" && supportCount === 0 ? <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-warning)]"><AlertTriangle className="h-3 w-3" /> Unsupported — confirmation unavailable</p> : null}
              </div>
              <div className="flex gap-2">
                {editable ? <Button size="sm" variant="outline" onClick={() => openEditor(record)}>Edit</Button> : null}
                {tab === "findings" && record.status === "draft" && supportCount > 0 && can("finding:update") ? (
                  <Button size="sm" onClick={() => confirmFinding.mutate(record)} disabled={confirmFinding.isPending}><CheckCircle2 className="h-4 w-4" /> Confirm finding</Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit provenance record</DialogTitle><DialogDescription>Changes preserve the complete before/after audit history.</DialogDescription></DialogHeader>
          <Input value={editForm.title} onChange={(event) => setEditForm((value) => ({ ...value, title: event.target.value }))} placeholder="Title" />
          <textarea value={editForm.description} onChange={(event) => setEditForm((value) => ({ ...value, description: event.target.value }))} className="min-h-32 rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" />
          {updateRecord.error ? <p className="text-sm text-[var(--color-danger)]">{updateRecord.error.message}</p> : null}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEditor} disabled={updateRecord.isPending}>Save audited edit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
