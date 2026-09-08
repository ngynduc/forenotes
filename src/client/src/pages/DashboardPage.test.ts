import { describe, expect, it } from "vitest";
import { DASHBOARD_NOTIFICATIONS_PATH, DASHBOARD_TABS, OVERVIEW_CHART_TITLES } from "./DashboardPage";

describe("DashboardPage configuration", () => {
  it("exposes only the three operational tabs", () => {
    expect(DASHBOARD_TABS.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: "overview", label: "Overview" },
      { id: "sla", label: "SLA Watch" },
      { id: "workload", label: "Workload" }
    ]);
  });

  it("keeps only the intended overview charts", () => {
    expect(OVERVIEW_CHART_TITLES).toEqual(["Task Status", "SLA Risk", "Workload"]);
  });

  it("routes unread work to Notifications", () => {
    expect(DASHBOARD_NOTIFICATIONS_PATH).toBe("/notifications");
  });
});
