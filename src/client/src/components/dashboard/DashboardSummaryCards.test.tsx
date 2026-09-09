import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { DashboardResponse } from "@shared/graph-types";
import { DashboardSummaryCards } from "./DashboardSummaryCards";

describe("DashboardSummaryCards", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders empty dashboard metrics", () => {
    const html = renderToStaticMarkup(<DashboardSummaryCards data={buildDashboard()} onSelectTab={() => undefined} onOpenNotifications={() => undefined} />);

    expect(html).toContain("SLA Watch");
    expect(html).toContain("Overdue Tasks");
    expect(html).toContain("Due Soon");
    expect(html).toContain("Unread");
    expect(html).toContain("Open tasks");
  });

  it("renders overdue, due soon, and unread breakdowns", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T08:00:00.000Z"));
    const html = renderToStaticMarkup(
      <DashboardSummaryCards
        data={buildDashboard({
          attention: 5,
          overdueTasks: 2,
          dueSoonTasks: 3,
          next24h: 1,
          next72h: 2,
          unreadTotal: 4,
          unreadTaskUpdates: 2
        })}
        onSelectTab={() => undefined}
        onOpenNotifications={() => undefined}
      />
    );

    expect(html).toContain("Assigned users");
    expect(html).toContain("Next 24h");
    expect(html).toContain("Task updates");
    expect(html).toContain("4");
  });
});

function buildDashboard(
  overrides: Partial<{
    attention: number;
    overdueTasks: number;
    dueSoonTasks: number;
    next24h: number;
    next72h: number;
    unreadTotal: number;
    unreadTaskUpdates: number;
  }> = {}
): DashboardResponse {
  const overdueTask = {
    id: "task-1",
    title: "Collect firewall logs",
    status: "todo",
    priority: "critical",
    dueAt: "2026-05-31T06:00:00.000Z",
    updatedAt: "2026-05-31T06:00:00.000Z",
    assignee: { id: "user-1", name: "Analyst" },
    case: { id: "case-1", name: "Acme IR" },
    incident: { id: "incident-1", name: "Identity-to-Cloud" }
  };

  const slaSummary = {
    attention: overrides.attention ?? 0,
    overdueTasks: overrides.overdueTasks ?? 0,
    dueSoonTasks: overrides.dueSoonTasks ?? 0,
    next24h: overrides.next24h ?? 0,
    next72h: overrides.next72h ?? 0,
    blockedTasks: 0,
    staleIncidents: 0,
    agingFindings: 0,
    unreadNotifications: overrides.unreadTotal ?? 0
  };

  return {
    summary: {
      scope: "team",
      sla: slaSummary,
      unread: {
        total: overrides.unreadTotal ?? 0,
        mentions: 0,
        caseUpdates: Math.max((overrides.unreadTotal ?? 0) - (overrides.unreadTaskUpdates ?? 0), 0),
        taskUpdates: overrides.unreadTaskUpdates ?? 0
      },
      activeIncidents: 0,
      openTasks: 0
    },
    charts: {
      taskStatusDistribution: [],
      slaRiskBreakdown: [],
      workloadByAssignee: []
    },
    sla: {
      summary: slaSummary,
      overdueTasks: slaSummary.overdueTasks > 0 ? [overdueTask] : [],
      dueSoonTasks: [],
      attentionItems: []
    },
    workload: { scope: "team", workload: [] }
  };
}
