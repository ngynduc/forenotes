import { describe, expect, it } from "vitest";
import type { ReportContext } from "../../shared/reportTypes.js";
import { executeChatTool } from "../services/reportChatService.js";

const context = {
  incident: { name: "Ransomware" },
  findings: [{ id: "f1", title: "Cobalt Strike beacon", created_at: "2026-01-02T00:00:00Z" }, { id: "f2", title: "Phishing email", created_at: "2026-01-05T00:00:00Z" }],
  timelineEvents: [{ id: "t1", event_time: "2026-01-01T10:00:00Z" }, { id: "t2", event_time: "2026-01-03T10:00:00Z" }],
  tasks: [], queries: [], indicators: [], systems: [], accounts: [], members: [], entityLinks: [], tags: { custom: [], attack: [] }
} as unknown as ReportContext;

describe("report chat tools", () => {
  it("summarises counts and timeline range", () => {
    const overview = executeChatTool(context, "get_incident_overview", {}) as { counts: Record<string, number>; timelineRange: { from: string; to: string } };
    expect(overview.counts).toMatchObject({ findings: 2, timeline_events: 2, tasks: 0 });
    expect(overview.timelineRange).toEqual({ from: "2026-01-01T10:00:00.000Z", to: "2026-01-03T10:00:00.000Z" });
  });
  it("filters by text and time and reports totals", () => {
    const byText = executeChatTool(context, "query_incident_data", { entity: "findings", search: "beacon" }) as unknown as { items: Array<{ id: string }> };
    expect(byText.items.map((item) => item.id)).toEqual(["f1"]);
    const byTime = executeChatTool(context, "query_incident_data", { entity: "timeline_events", from: "2026-01-02T00:00:00Z" }) as { total: number; returned: number };
    expect(byTime).toMatchObject({ total: 1, returned: 1 });
    expect(executeChatTool(context, "query_incident_data", { entity: "findings", limit: 1 })).toMatchObject({ total: 2, returned: 1, truncated: true });
  });
  it("rejects unknown entities and tools", () => {
    expect(() => executeChatTool(context, "query_incident_data", { entity: "users" })).toThrow(/entity must be/);
    expect(() => executeChatTool(context, "drop_tables", {})).toThrow(/Unknown tool/);
  });
});
