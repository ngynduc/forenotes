import type { DashboardSlaResponse, DashboardTaskItem } from "@shared/graph-types";
import { formatDueStatus, utcMillis } from "@/lib/timezone";

export type SlaState = "overdue" | "due_soon" | "attention";

export type SlaWatchRow = DashboardTaskItem & {
  slaState: SlaState;
};

export interface SlaWatchFilters {
  slaState: string;
  status: string;
  priority: string;
  assignee: string;
  caseId: string;
  incidentId: string;
  dueRange: string;
}

export interface SlaWatchViewState {
  filters: SlaWatchFilters;
  page: number;
  pageSize: number;
}

export type SlaWatchViewAction =
  | { type: "set_filter"; key: keyof SlaWatchFilters; value: string }
  | { type: "reset_filters" }
  | { type: "set_page"; page: number }
  | { type: "set_page_size"; pageSize: number };

export const EMPTY_SLA_FILTERS: SlaWatchFilters = {
  slaState: "all",
  status: "all",
  priority: "all",
  assignee: "all",
  caseId: "all",
  incidentId: "all",
  dueRange: "all"
};

export const INITIAL_SLA_VIEW_STATE: SlaWatchViewState = {
  filters: EMPTY_SLA_FILTERS,
  page: 1,
  pageSize: 10
};

const SLA_URGENCY: Record<SlaState, number> = {
  overdue: 0,
  due_soon: 1,
  attention: 2
};

export function slaWatchViewReducer(state: SlaWatchViewState, action: SlaWatchViewAction): SlaWatchViewState {
  if (action.type === "set_filter") {
    return { ...state, filters: { ...state.filters, [action.key]: action.value }, page: 1 };
  }
  if (action.type === "reset_filters") {
    return { ...state, filters: EMPTY_SLA_FILTERS, page: 1 };
  }
  if (action.type === "set_page_size") {
    return { ...state, pageSize: action.pageSize, page: 1 };
  }
  return { ...state, page: action.page };
}

export function mergeSlaRows(data: DashboardSlaResponse): SlaWatchRow[] {
  const rows = new Map<string, SlaWatchRow>();
  const addRows = (tasks: DashboardTaskItem[], slaState: SlaState) => {
    for (const task of tasks) {
      if (!rows.has(task.id)) rows.set(task.id, { ...task, slaState });
    }
  };

  addRows(data.overdueTasks, "overdue");
  addRows(data.dueSoonTasks, "due_soon");
  addRows(data.attentionItems, "attention");
  return sortSlaRows([...rows.values()]);
}

export function sortSlaRows(rows: SlaWatchRow[]): SlaWatchRow[] {
  return [...rows].sort((left, right) => {
    const urgency = SLA_URGENCY[left.slaState] - SLA_URGENCY[right.slaState];
    if (urgency !== 0) return urgency;
    const leftDue = utcMillis(left.dueAt) ?? Number.POSITIVE_INFINITY;
    const rightDue = utcMillis(right.dueAt) ?? Number.POSITIVE_INFINITY;
    return leftDue - rightDue || left.title.localeCompare(right.title);
  });
}

export function applySlaFilters(rows: SlaWatchRow[], filters: SlaWatchFilters, timezone: string): SlaWatchRow[] {
  return rows.filter((task) => {
    if (filters.slaState !== "all" && task.slaState !== filters.slaState) return false;
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
