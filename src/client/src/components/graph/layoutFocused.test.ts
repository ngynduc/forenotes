import { describe, expect, it } from "vitest";
import type { GraphEdge, GraphNode } from "@shared/graph-types";
import { layoutFocused } from "./layout";

const node = (id: string, type: GraphNode["type"]): GraphNode => ({ id, type, entityId: id, label: id });

describe("layoutFocused", () => {
  it("never overlaps nodes, with findings above their revealed neighbours", () => {
    const nodes = [...Array.from({ length: 7 }, (_, i) => node(`f${i}`, "finding")),
      ...Array.from({ length: 9 }, (_, i) => node(`t${i}`, "timeline_event"))];
    const edges = nodes.filter((n) => n.type !== "finding").map((n) => ({ id: n.id, source: n.id, target: "f3", type: "evidence_for", label: "", derived: true }) as GraphEdge);
    const laid = layoutFocused(nodes, edges, "f3");
    for (const a of laid) for (const b of laid) {
      if (a.id >= b.id) continue;
      const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
      expect(apart, `${a.id} overlaps ${b.id}`).toBe(true);
    }
    const lowestFinding = Math.max(...laid.filter((n) => n.type === "finding").map((n) => n.y + n.height));
    expect(Math.min(...laid.filter((n) => n.type !== "finding").map((n) => n.y))).toBeGreaterThan(lowestFinding);
  });
});
