import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import type { GraphEdge, GraphNode } from "@shared/graph-types";
import { edgeAttachment } from "./edgeGeometry";
import { layoutNodes, placeNewNodes, type LayoutNode } from "./layout";

const node = (id: string, label = id): GraphNode => ({ id, entityId: id, label, type: "finding" });
const edge = (source: string, target: string): GraphEdge => ({ id: `${source}-${target}`, source, target, type: "related_to", label: "related", derived: false });
function expectNoOverlap(nodes: LayoutNode[]) {
  for (let i = 0; i < nodes.length; i++) {
    for (const other of nodes.slice(i + 1)) {
      const current = nodes[i];
      expect(current.x + current.width <= other.x || other.x + other.width <= current.x ||
        current.y + current.height <= other.y || other.y + other.height <= current.y).toBe(true);
    }
  }
}

describe("Floating edge attachment", () => {
  const source = { x: 0, y: 0, width: 240, height: 84 };
  it.each([
    [0, 300, Position.Bottom, Position.Top],
    [0, -300, Position.Top, Position.Bottom],
    [400, 0, Position.Right, Position.Left],
    [-400, 0, Position.Left, Position.Right],
  ] as const)("attaches correctly at (%s,%s)", (x, y, sourcePosition, targetPosition) => {
    const geometry = edgeAttachment(source, { ...source, x, y });
    expect(geometry).toMatchObject({ sourcePosition, targetPosition });
    if (sourcePosition === Position.Bottom) expect(geometry).toMatchObject({ sourceX: 120, sourceY: 84, targetX: 120, targetY: 300 });
    if (sourcePosition === Position.Right) expect(geometry).toMatchObject({ sourceX: 240, sourceY: 42, targetX: 400, targetY: 42 });
  });
  it("uses measured centers with unequal dimensions and switches as nodes move", () => {
    const target = { x: 100, y: 150, width: 40, height: 200 };
    expect(edgeAttachment(source, target).sourcePosition).toBe(Position.Bottom);
    expect(edgeAttachment(source, { ...target, x: 500 }).sourcePosition).toBe(Position.Right);
    expect(edgeAttachment(source, { ...target, x: -500 }).sourcePosition).toBe(Position.Left);
    expect(edgeAttachment(source, { ...target, y: -400 }).sourcePosition).toBe(Position.Top);
  });
});

describe("Hierarchical placement", () => {
  it("separates siblings and descendants using measured dimensions", () => {
    const nodes = ["root", "a", "b", "one", "two", "three"].map((id) => node(id));
    const edges = [edge("root", "a"), edge("root", "b"), edge("a", "one"), edge("a", "two"), edge("b", "three")];
    const dimensions = new Map(nodes.map((item, index) => [item.id, { width: 180 + index * 80, height: 84 + index * 120 }]));
    const layout = layoutNodes(nodes, edges, dimensions);
    expectNoOverlap(layout);
    const byId = new Map(layout.map((item) => [item.id, item]));
    expect(byId.get("a")!.y).toBe(byId.get("b")!.y);
    expect(byId.get("root")!.y + byId.get("root")!.height).toBeLessThan(byId.get("a")!.y);
    expect(byId.get("a")!.y + byId.get("a")!.height).toBeLessThan(byId.get("one")!.y);
    expect(byId.get("one")!.x).toBeLessThan(byId.get("three")!.x);
  });
  it("handles cycles, duplicate edges, disconnected nodes and missing endpoints", () => {
    const nodes = ["a", "b", "c", "isolated"].map((id) => node(id));
    const layout = layoutNodes(nodes, [edge("a", "b"), edge("b", "c"), edge("c", "a"), edge("a", "b"), edge("missing", "a"), edge("c", "c")]);
    expect(layout).toHaveLength(nodes.length);
    expect(layout.every((item) => Number.isFinite(item.x) && Number.isFinite(item.y))).toBe(true);
    expectNoOverlap(layout);
    expect(layoutNodes([])).toEqual([]);
  });
  it("reserves height for long and multiline content", () => {
    const layout = layoutNodes([
      { ...node("long", "Large node label ".repeat(70)), subtitle: "Long subtitle ".repeat(40), status: "confirmed" },
      node("child"),
    ], [edge("long", "child")]);
    expect(layout[0].height).toBeGreaterThan(500);
    expectNoOverlap(layout);
  });
  it("preserves existing positions and avoids collisions when inserting nodes", () => {
    const layout = layoutNodes(["a", "b", "c"].map((id) => node(id)));
    const manual = [{ ...layout[0], x: 200, y: 0, width: 600, height: 300 }, { ...layout[1], x: -400, y: 50 }];
    const result = placeNewNodes(layout, manual);
    expect(result[0]).toMatchObject({ x: 200, y: 0 });
    expect(result[1]).toMatchObject({ x: -400, y: 50 });
    expectNoOverlap(result.map((item) => manual.find((saved) => saved.id === item.id) ?? item));
  });
  it("lays out a moderately sized graph deterministically", () => {
    const nodes = Array.from({ length: 150 }, (_, index) => node(String(index)));
    const edges = nodes.slice(1).map((item, index) => edge(String(Math.floor(index / 3)), item.id));
    const layout = layoutNodes(nodes, edges);
    expect(layout).toEqual(layoutNodes(nodes, edges));
    expectNoOverlap(layout);
  });
});
