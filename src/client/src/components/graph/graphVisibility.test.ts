import { describe, expect, it } from "vitest";
import type { GraphEdge, GraphNode, GraphResponse } from "@shared/graph-types";
import { filterAssignmentEdges } from "./graphVisibility";

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
