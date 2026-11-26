import { describe, expect, it } from "vitest";
import type { GraphEdge, GraphNode, GraphResponse } from "@shared/graph-types";
import { filterAssignmentEdges, filterSupportingTimelineEvents, filterToFocusedFinding } from "./graphVisibility";

const node = (id: string, type: GraphNode["type"]): GraphNode => ({ id, type, entityId: id, label: id });
const edge = (source: string, target: string, type: GraphEdge["type"], derived = true): GraphEdge =>
  ({ id: `${source}-${target}-${type}`, source, target, type, label: type, derived });
function graph(nodes: GraphNode[], edges: GraphEdge[]): GraphResponse {
  return { incidentId: "incident", mode: "overview", nodes, edges, stats: {
    totalNodes: nodes.length, totalEdges: edges.length, findings: nodes.filter(n => n.type === "finding").length,
    timelineEvents: 0, tasks: 0, mitreTechniques: 0, mitreTactics: 0, systems: 0, accounts: 0, iocs: 0,
    manualLinks: edges.filter(e => !e.derived).length, derivedLinks: edges.filter(e => e.derived).length,
  } };
}

describe("Assignment visibility", () => {
  it("hides derived and manual assignment edges, keeping evidence and other user relationships", () => {
    const input = graph(
      [node("finding", "finding"), node("timeline", "timeline_event"), node("owner", "user"), node("reviewer", "user")],
      [edge("finding", "owner", "assigned_to"), edge("timeline", "owner", "assigned_to", false),
        edge("timeline", "finding", "evidence_for"), edge("finding", "reviewer", "related_to", false)]
    );
    const result = filterAssignmentEdges(input, false);
    expect(result.nodes.map(n => n.id)).toEqual(["finding", "timeline", "reviewer"]);
    expect(result.edges.map(e => e.type)).toEqual(["evidence_for", "related_to"]);
    expect(result.stats).toMatchObject({ totalNodes: 3, totalEdges: 2, findings: 1, derivedLinks: 1, manualLinks: 1 });
    expect(input.nodes).toHaveLength(4);
    expect(input.edges).toHaveLength(4);
    expect(filterAssignmentEdges(input, true)).toBe(input);
  });

  it("keeps incident records even when assignment was their only edge", () => {
    const input = graph([node("task", "task"), node("owner", "user")], [edge("task", "owner", "assigned_to")]);
    expect(filterAssignmentEdges(input, false).nodes.map(n => n.id)).toEqual(["task"]);
    expect(filterAssignmentEdges(input, false).edges).toEqual([]);
  });

  it("removes a large assignment fan-out and restores it when enabled", () => {
    const findings = Array.from({ length: 150 }, (_, i) => node(`finding-${i}`, "finding"));
    const input = graph([...findings, node("owner", "user")], findings.map(n => edge(n.id, "owner", "assigned_to")));
    const hidden = filterAssignmentEdges(input, false);
    expect(hidden.nodes).toHaveLength(150);
    expect(hidden.edges).toHaveLength(0);
    expect(hidden.stats).toMatchObject({ totalNodes: 150, totalEdges: 0, findings: 150 });
    expect(filterAssignmentEdges(input, true).edges).toHaveLength(150);
  });

  it("handles an empty graph", () => {
    const result = filterAssignmentEdges(graph([], []), false);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.stats).toMatchObject({ totalNodes: 0, totalEdges: 0, manualLinks: 0, derivedLinks: 0 });
  });
});

describe("filterSupportingTimelineEvents", () => {
  it("hides supporting events until their primary event is expanded", () => {
    const primary = { ...node("primary", "timeline_event"), entityId: "p1", metadata: { eventRole: "primary", eventTime: "2026-01-01T00:00:00Z" } };
    const supporting = { ...node("support", "timeline_event"), entityId: "s1", metadata: { eventRole: "supporting", primaryEventId: "p1" } };
    const input = graph(
      [primary, supporting, node("finding", "finding")],
      [edge("primary", "support", "related_to"), edge("support", "finding", "evidence_for")]
    );

    expect(filterSupportingTimelineEvents(input, new Set()).nodes.map((item) => item.id)).toEqual(["primary", "finding"]);
    const expanded = filterSupportingTimelineEvents(input, new Set(["p1"]));
    expect(expanded.nodes.map((item) => item.id)).toEqual(["primary", "support", "finding"]);
    expect(expanded.edges).toHaveLength(2);
  });
});

describe("Finding focus", () => {
  const input = graph(
    [node("f1", "finding"), node("f2", "finding"), node("t1", "timeline_event"), node("t2", "timeline_event"), node("sys", "system")],
    [edge("t1", "f1", "evidence_for"), edge("t2", "f2", "evidence_for"), edge("f1", "sys", "related_to")]
  );
  it("shows only findings when nothing is focused", () => {
    const result = filterToFocusedFinding(input, null);
    expect(result.nodes.map(n => n.id)).toEqual(["f1", "f2"]);
    expect(result.edges).toEqual([]);
  });
  it("adds only the focused finding's direct neighbours", () => {
    const result = filterToFocusedFinding(input, "f1");
    expect(result.nodes.map(n => n.id)).toEqual(["f1", "f2", "t1", "sys"]);
    expect(result.edges.map(e => e.id)).toEqual(["t1-f1-evidence_for", "f1-sys-related_to"]);
  });
});
