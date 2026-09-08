import { useMemo, useReducer } from "react";
import type { DashboardSlaResponse } from "@shared/graph-types";
import { Badge } from "@/components/ui/Badge";
import { DashboardTablePagination, paginateDashboardRows } from "@/components/dashboard/DashboardTablePagination";
import { formatDateTimeForTimezone, formatDueStatus } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import {
  applySlaFilters,
  INITIAL_SLA_VIEW_STATE,
  mergeSlaRows,
  slaWatchViewReducer,
  type SlaState,
  type SlaWatchFilters,
  type SlaWatchRow
} from "./slaWatch";

interface SlaWatchTabProps {
  data: DashboardSlaResponse;
  timezone: string;
}

const SLA_STATE_STYLES: Record<SlaState, string> = {
  overdue: "border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  due_soon: "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  attention: "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
};

const DUE_STATUS_STYLES = {
  none: "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
  overdue: SLA_STATE_STYLES.overdue,
  due_soon: SLA_STATE_STYLES.due_soon,
  upcoming: "border-[var(--color-success-border)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
};

export function SlaWatchTab({ data, timezone }: SlaWatchTabProps) {
  const [view, dispatch] = useReducer(slaWatchViewReducer, INITIAL_SLA_VIEW_STATE);
  const rows = useMemo(() => mergeSlaRows(data), [data]);
  const options = useMemo(() => buildFilterOptions(rows), [rows]);
  const filteredRows = useMemo(() => applySlaFilters(rows, view.filters, timezone), [rows, timezone, view.filters]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / view.pageSize));
  const safePage = Math.min(view.page, pageCount);
  const visibleRows = useMemo(() => paginateDashboardRows(filteredRows, safePage, view.pageSize), [filteredRows, safePage, view.pageSize]);

  function updateFilter(key: keyof SlaWatchFilters, value: string) {
    dispatch({ type: "set_filter", key, value });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-panel)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--color-warning)] shadow-[0_0_12px_var(--color-warning)]" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">SLA Watch</h2>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">One urgency-ordered queue for every task that needs operational attention.</p>
          </div>
          <button
            type="button"
            className="self-start rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary-border)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] lg:self-auto"
            onClick={() => dispatch({ type: "reset_filters" })}
          >
            Reset filters
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <FilterSelect label="SLA state" value={view.filters.slaState} onChange={(value) => updateFilter("slaState", value)} options={[
            { value: "overdue", label: "Overdue" },
            { value: "due_soon", label: "Due soon" },
            { value: "attention", label: "Attention" }
          ]} />
          <FilterSelect label="Status" value={view.filters.status} onChange={(value) => updateFilter("status", value)} options={options.statuses} />
          <FilterSelect label="Priority" value={view.filters.priority} onChange={(value) => updateFilter("priority", value)} options={options.priorities} />
          <FilterSelect label="Assignee" value={view.filters.assignee} onChange={(value) => updateFilter("assignee", value)} options={options.assignees} />
          <FilterSelect label="Case" value={view.filters.caseId} onChange={(value) => updateFilter("caseId", value)} options={options.cases} />
          <FilterSelect label="Incident" value={view.filters.incidentId} onChange={(value) => updateFilter("incidentId", value)} options={options.incidents} />
          <FilterSelect label="Due range" value={view.filters.dueRange} onChange={(value) => updateFilter("dueRange", value)} options={[
            { value: "overdue", label: "Overdue" },
            { value: "next24", label: "Next 24h" },
            { value: "next72", label: "Next 72h" },
            { value: "unscheduled", label: "No due date" }
          ]} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-panel)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Attention queue</h3>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Overdue first, then due soon, then attention.</p>
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-muted)]">{filteredRows.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-[var(--color-surface-muted)] text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              <tr>
                {['Task title', 'SLA state', 'Status', 'Priority', 'Due', 'Assignee', 'Case', 'Incident', 'Linked entity'].map((label) => (
                  <th key={label} className="px-4 py-3 font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">No SLA tasks match the current filters.</td></tr>
              ) : visibleRows.map((task) => <TaskRow key={task.id} task={task} timezone={timezone} />)}
            </tbody>
          </table>
        </div>
        <DashboardTablePagination
          page={safePage}
          pageSize={view.pageSize}
          total={filteredRows.length}
          onPageChange={(page) => dispatch({ type: "set_page", page })}
          onPageSizeChange={(pageSize) => dispatch({ type: "set_page_size", pageSize })}
        />
      </section>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-[var(--color-text-muted)]">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-2 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]">
        <option value="all">All</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function TaskRow({ task, timezone }: { task: SlaWatchRow; timezone: string }) {
  const dueStatus = formatDueStatus(task.dueAt, timezone);
  return (
    <tr className="border-t border-[var(--color-border)] align-top transition-colors hover:bg-[var(--color-surface-muted)]/60">
      <td className="max-w-[280px] px-4 py-3"><span className="block truncate font-medium text-[var(--color-text)]" title={task.title}>{task.title}</span></td>
      <td className="px-4 py-3"><Badge variant="outline" className={SLA_STATE_STYLES[task.slaState]}>{formatSlaState(task.slaState)}</Badge></td>
      <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{task.status.replace(/_/g, " ")}</Badge></td>
      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
      <td className="whitespace-nowrap px-4 py-3"><div className="font-mono text-xs text-[var(--color-text)]">{formatDateTimeForTimezone(task.dueAt, timezone)}</div><span className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", DUE_STATUS_STYLES[dueStatus.status])}>{dueStatus.label}</span></td>
      <td className="max-w-[180px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate">{task.assignee?.name ?? "Unassigned"}</span></td>
      <td className="max-w-[220px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate">{task.case.name}</span></td>
      <td className="max-w-[220px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate">{task.incident.name}</span></td>
      <td className="max-w-[320px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate">{task.linkedEntity ? `${task.linkedEntity.type.replace(/_/g, " ")}: ${task.linkedEntity.name}` : "—"}</span></td>
    </tr>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const className = priority === "critical" || priority === "high"
    ? "border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
    : priority === "medium"
      ? "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
      : "border-[var(--color-success-border)] bg-[var(--color-success-soft)] text-[var(--color-success)]";
  return <Badge variant="outline" className={cn("capitalize", className)}>{priority}</Badge>;
}

function formatSlaState(state: SlaState) {
  return state === "due_soon" ? "Due soon" : state[0].toUpperCase() + state.slice(1);
}

function buildFilterOptions(tasks: SlaWatchRow[]) {
  return {
    statuses: uniqueOptions(tasks.map((task) => ({ value: task.status, label: task.status.replace(/_/g, " ") }))),
    priorities: uniqueOptions(tasks.map((task) => ({ value: task.priority, label: task.priority }))),
    assignees: uniqueOptions(tasks.map((task) => ({ value: task.assignee?.id ?? "unassigned", label: task.assignee?.name ?? "Unassigned" }))),
    cases: uniqueOptions(tasks.map((task) => ({ value: task.case.id, label: task.case.name }))),
    incidents: uniqueOptions(tasks.map((task) => ({ value: task.incident.id, label: task.incident.name })))
  };
}

function uniqueOptions(options: Array<{ value: string; label: string }>) {
  return [...new Map(options.map((option) => [option.value, option])).values()].sort((left, right) => left.label.localeCompare(right.label));
}
