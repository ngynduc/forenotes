import { afterEach, describe, expect, it, vi } from "vitest";
import type { DashboardSlaResponse, DashboardTaskItem } from "@shared/graph-types";
import {
  applySlaFilters,
  EMPTY_SLA_FILTERS,
  INITIAL_SLA_VIEW_STATE,
  mergeSlaRows,
  slaWatchViewReducer,
  sortSlaRows,
  type SlaWatchFilters,
  type SlaWatchRow
} from "./slaWatch";

describe("SLA Watch row model", () => {
  afterEach(() => vi.useRealTimers());

  it("merges rows once with overdue, due soon, then attention precedence", () => {
    const duplicate = task({ id: "duplicate" });
    const rows = mergeSlaRows(response({
      overdueTasks: [duplicate],
      dueSoonTasks: [duplicate, task({ id: "due-soon" })],
      attentionItems: [duplicate, task({ id: "attention" })]
    }));

    expect(rows.map(({ id, slaState }) => [id, slaState])).toEqual([
      ["duplicate", "overdue"],
      ["due-soon", "due_soon"],
      ["attention", "attention"]
    ]);
  });

  it("sorts by SLA urgency and due date, with unscheduled rows last", () => {
    const rows: SlaWatchRow[] = [
      row("attention-none", "attention", null),
      row("soon-later", "due_soon", "2026-06-02T08:00:00.000Z"),
      row("overdue-later", "overdue", "2026-06-01T07:00:00.000Z"),
      row("attention-due", "attention", "2026-06-03T08:00:00.000Z"),
      row("overdue-earlier", "overdue", "2026-06-01T06:00:00.000Z")
    ];

    expect(sortSlaRows(rows).map((item) => item.id)).toEqual([
      "overdue-earlier",
      "overdue-later",
      "soon-later",
      "attention-due",
      "attention-none"
    ]);
  });

  it("supports SLA state, status, priority, assignee, case, and incident filters", () => {
    const matching = task({ id: "matching", status: "blocked", priority: "critical" });
    const other = task({
      id: "other",
      status: "todo",
      priority: "low",
      assignee: null,
      case: { id: "case-2", name: "Case Two" },
      incident: { id: "incident-2", name: "Incident Two" }
    });
    const rows = mergeSlaRows(response({ overdueTasks: [matching], attentionItems: [other] }));
    const checks: Array<[keyof SlaWatchFilters, string]> = [
      ["slaState", "overdue"],
      ["status", "blocked"],
      ["priority", "critical"],
      ["assignee", "user-1"],
      ["caseId", "case-1"],
      ["incidentId", "incident-1"]
    ];

    for (const [key, value] of checks) {
      expect(applySlaFilters(rows, { ...EMPTY_SLA_FILTERS, [key]: value }, "UTC").map((item) => item.id)).toEqual(["matching"]);
    }
    expect(applySlaFilters(rows, { ...EMPTY_SLA_FILTERS, assignee: "unassigned" }, "UTC").map((item) => item.id)).toEqual(["other"]);
  });

  it("filters overdue, next-24-hour, next-72-hour, and unscheduled ranges across timezones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T06:30:00.000Z"));
    const rows = mergeSlaRows(response({ attentionItems: [
      task({ id: "overdue", dueAt: "2026-03-08T06:00:00.000Z" }),
      task({ id: "next24", dueAt: "2026-03-08T07:00:00.000Z" }),
      task({ id: "next72", dueAt: "2026-03-09T12:00:00.000Z" }),
      task({ id: "none", dueAt: null })
    ] }));

    for (const timezone of ["UTC", "America/New_York", "Asia/Ho_Chi_Minh"]) {
      expect(filterDue(rows, "overdue", timezone)).toEqual(["overdue"]);
      expect(filterDue(rows, "next24", timezone)).toEqual(["next24"]);
      expect(filterDue(rows, "next72", timezone)).toEqual(["next72"]);
      expect(filterDue(rows, "unscheduled", timezone)).toEqual(["none"]);
    }
  });

  it("returns an empty result when no row matches", () => {
    const rows = mergeSlaRows(response({ attentionItems: [task()] }));
    expect(applySlaFilters(rows, { ...EMPTY_SLA_FILTERS, status: "done" }, "UTC")).toEqual([]);
  });

  it("resets pagination when filters, reset, or page size changes", () => {
    const paged = { ...INITIAL_SLA_VIEW_STATE, page: 4 };
    expect(slaWatchViewReducer(paged, { type: "set_filter", key: "priority", value: "high" }).page).toBe(1);
    expect(slaWatchViewReducer(paged, { type: "reset_filters" }).page).toBe(1);
    expect(slaWatchViewReducer(paged, { type: "set_page_size", pageSize: 25 })).toEqual(expect.objectContaining({ page: 1, pageSize: 25 }));
    expect(slaWatchViewReducer(paged, { type: "set_page", page: 2 }).page).toBe(2);
  });
});

function filterDue(rows: SlaWatchRow[], dueRange: string, timezone: string) {
  return applySlaFilters(rows, { ...EMPTY_SLA_FILTERS, dueRange }, timezone).map((item) => item.id);
}

function row(id: string, slaState: SlaWatchRow["slaState"], dueAt: string | null): SlaWatchRow {
  return { ...task({ id, title: id, dueAt }), slaState };
}

function task(overrides: Partial<DashboardTaskItem> = {}): DashboardTaskItem {
  return {
    id: "task-1",
    title: "Investigate endpoint",
    status: "blocked",
    priority: "critical",
    dueAt: "2026-06-01T06:00:00.000Z",
    updatedAt: "2026-06-01T05:00:00.000Z",
    assignee: { id: "user-1", name: "Analyst" },
    case: { id: "case-1", name: "Case One" },
    incident: { id: "incident-1", name: "Incident One" },
    ...overrides
  };
}

function response(overrides: Partial<DashboardSlaResponse> = {}): DashboardSlaResponse {
  return {
    summary: {
      attention: 0,
      overdueTasks: 0,
      dueSoonTasks: 0,
      next24h: 0,
      next72h: 0,
      blockedTasks: 0,
      staleIncidents: 0,
      agingFindings: 0,
      unreadNotifications: 0
    },
    overdueTasks: [],
    dueSoonTasks: [],
    attentionItems: [],
    ...overrides
  };
}
