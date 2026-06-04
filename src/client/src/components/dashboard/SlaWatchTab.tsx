import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { DashboardSlaResponse, DashboardTaskItem } from "@shared/graph-types";
import { DashboardTablePagination, paginateDashboardRows } from "@/components/dashboard/DashboardTablePagination";
import { formatDateTimeForTimezone, formatDueStatus } from "@/lib/timezone";
import { cn } from "@/lib/utils";

interface SlaWatchTabProps {
  data: DashboardSlaResponse;
  timezone: string;
}

interface Filters {
  status: string;
  priority: string;
  assignee: string;
  caseId: string;
  incidentId: string;
  dueRange: string;
}

const EMPTY_FILTERS: Filters = {
  status: "all",
  priority: "all",
  assignee: "all",
  caseId: "all",
  incidentId: "all",
  dueRange: "all"
};

const DUE_STATUS_STYLES = {
  none: "bg-slate-50 text-slate-600 border-slate-200",
  overdue: "bg-rose-50 text-rose-700 border-rose-200",
  due_soon: "bg-amber-50 text-amber-700 border-amber-200",
  upcoming: "bg-emerald-50 text-emerald-700 border-emerald-200"
};

export function SlaWatchTab({ data, timezone }: SlaWatchTabProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const allTasks = useMemo(
    () => [...data.overdueTasks, ...data.dueSoonTasks, ...data.attentionItems],
    [data.attentionItems, data.dueSoonTasks, data.overdueTasks]
  );
  const options = useMemo(() => buildFilterOptions(allTasks), [allTasks]);

  const overdueTasks = useMemo(() => applyFilters(data.overdueTasks, filters, timezone), [data.overdueTasks, filters, timezone]);
  const dueSoonTasks = useMemo(() => applyFilters(data.dueSoonTasks, filters, timezone), [data.dueSoonTasks, filters, timezone]);
  const attentionItems = useMemo(() => applyFilters(data.attentionItems, filters, timezone), [data.attentionItems, filters, timezone]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[8px] border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">SLA Watch</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Drill into overdue, due-soon, and attention tasks in your dashboard scope.</p>
          </div>
          <button
            type="button"
            className="self-start rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] lg:self-auto"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            Reset filters
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <FilterSelect label="Status" value={filters.status} onChange={(value) => updateFilter("status", value)} options={options.statuses} />
          <FilterSelect label="Priority" value={filters.priority} onChange={(value) => updateFilter("priority", value)} options={options.priorities} />
          <FilterSelect label="Assignee" value={filters.assignee} onChange={(value) => updateFilter("assignee", value)} options={options.assignees} />
          <FilterSelect label="Case" value={filters.caseId} onChange={(value) => updateFilter("caseId", value)} options={options.cases} />
          <FilterSelect label="Incident" value={filters.incidentId} onChange={(value) => updateFilter("incidentId", value)} options={options.incidents} />
          <FilterSelect
            label="Due range"
            value={filters.dueRange}
            onChange={(value) => updateFilter("dueRange", value)}
            options={[
              { value: "overdue", label: "Overdue" },
              { value: "next24", label: "Next 24h" },
              { value: "next72", label: "Next 72h" },
              { value: "unscheduled", label: "No due date" }
            ]}
          />
        </div>
      </section>

      <TaskSection title="Overdue Tasks" tasks={overdueTasks} timezone={timezone} emptyText="No overdue tasks match the current filters." />
      <TaskSection title="Due Soon Tasks" tasks={dueSoonTasks} timezone={timezone} emptyText="No due-soon tasks match the current filters." />
      <TaskSection title="Attention Items" tasks={attentionItems} timezone={timezone} emptyText="No attention items match the current filters." />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-[var(--color-text-muted)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[6px] border border-[var(--color-border)] bg-white px-2 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TaskSection({ title, tasks, timezone, emptyText }: { title: string; tasks: DashboardTaskItem[]; timezone: string; emptyText: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleTasks = useMemo(() => paginateDashboardRows(tasks, safePage, pageSize), [tasks, safePage, pageSize]);

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-muted)]">{tasks.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Task title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 font-semibold">Assignee</th>
              <th className="px-4 py-3 font-semibold">Case</th>
              <th className="px-4 py-3 font-semibold">Incident</th>
              <th className="px-4 py-3 font-semibold">Linked entity</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                  {emptyText}
                </td>
              </tr>
            ) : (
              visibleTasks.map((task) => <TaskRow key={task.id} task={task} timezone={timezone} />)
            )}
          </tbody>
        </table>
      </div>
      <DashboardTablePagination page={safePage} pageSize={pageSize} total={tasks.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </section>
  );
}

function TaskRow({ task, timezone }: { task: DashboardTaskItem; timezone: string }) {
  const dueStatus = formatDueStatus(task.dueAt, timezone);

  return (
    <tr className="border-t border-[var(--color-border)] align-top">
      <td className="max-w-[280px] px-4 py-3">
        <div className="truncate font-medium text-[var(--color-text)]" title={task.title}>{task.title}</div>
      </td>
      <td className="px-4 py-3">
        <Badge>{task.status.replace(/_/g, " ")}</Badge>
      </td>
      <td className="px-4 py-3">
        <Badge tone={task.priority}>{task.priority}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="font-mono text-xs text-[var(--color-text)]">{formatDateTimeForTimezone(task.dueAt, timezone)}</div>
        <span className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", DUE_STATUS_STYLES[dueStatus.status])}>
          {dueStatus.label}
        </span>
      </td>
      <td className="max-w-[180px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate" title={task.assignee?.name ?? "Unassigned"}>{task.assignee?.name ?? "Unassigned"}</span></td>
      <td className="max-w-[220px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate" title={task.case.name}>{task.case.name}</span></td>
      <td className="max-w-[220px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate" title={task.incident.name}>{task.incident.name}</span></td>
      <td className="max-w-[360px] px-4 py-3 text-[var(--color-text-muted)]">
        <span className="block truncate" title={task.linkedEntity ? `${task.linkedEntity.type.replace(/_/g, " ")}: ${task.linkedEntity.name}` : "-"}>
          {task.linkedEntity ? `${task.linkedEntity.type.replace(/_/g, " ")}: ${task.linkedEntity.name}` : "-"}
        </span>
      </td>
    </tr>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
        tone === "critical" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "high" && "border-orange-200 bg-orange-50 text-orange-700",
        tone === "medium" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "low" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        !tone && "border-slate-200 bg-slate-50 text-slate-700"
      )}
    >
      {children}
    </span>
  );
}

function buildFilterOptions(tasks: DashboardTaskItem[]) {
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

function applyFilters(tasks: DashboardTaskItem[], filters: Filters, timezone: string) {
  return tasks.filter((task) => {
    if (filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (filters.assignee !== "all" && (task.assignee?.id ?? "unassigned") !== filters.assignee) return false;
    if (filters.caseId !== "all" && task.case.id !== filters.caseId) return false;
    if (filters.incidentId !== "all" && task.incident.id !== filters.incidentId) return false;
    if (filters.dueRange === "all") return true;
    const dueStatus = formatDueStatus(task.dueAt, timezone);
    if (filters.dueRange === "overdue") return dueStatus.status === "overdue";
    if (filters.dueRange === "unscheduled") return dueStatus.status === "none";
    if (filters.dueRange === "next24") return dueStatus.label === "Due next 24h";
    if (filters.dueRange === "next72") return dueStatus.label === "Due next 72h";
    return true;
  });
}
