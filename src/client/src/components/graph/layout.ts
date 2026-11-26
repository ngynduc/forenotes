import type { GraphEdge, GraphNode } from "@shared/graph-types";

export interface LayoutNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const GRAPH_SPACING = { horizontalGap: 112, rankGap: 120, siblingGap: 88 };
export const NODE_WIDTH = 240;
export type NodeDimensions = ReadonlyMap<string, { width: number; height: number }>;

function estimateHeight(node: GraphNode) {
  const lines = (value: string) => value.split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 18)), 0);
  return Math.max(84, 32 + lines(node.label) * 19 + (node.subtitle ? 4 + lines(node.subtitle) * 16 : 0) + (node.status ? 28 : 0));
}

export function layoutNodes(nodes: GraphNode[], edges: GraphEdge[] = [], dimensions: NodeDimensions = new Map()): LayoutNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const children = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  const parents = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of edges) {
    if (edge.source === edge.target || !byId.has(edge.source) || !byId.has(edge.target)) continue;
    children.get(edge.source)!.add(edge.target);
    parents.get(edge.target)!.add(edge.source);
  }
  const degree = new Map(nodes.map((node) => [node.id, parents.get(node.id)!.size]));
  const ranks = new Map<string, number>();
  const queue = nodes.filter((node) => degree.get(node.id) === 0).map((node) => node.id);
  queue.forEach((id) => ranks.set(id, 0));
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index];
    for (const child of children.get(id)!) {
      ranks.set(child, Math.max(ranks.get(child) ?? 0, ranks.get(id)! + 1));
      degree.set(child, degree.get(child)! - 1);
      if (degree.get(child) === 0) queue.push(child);
    }
  }
  // Relationships can contain cycles. Lay out the unprocessed component as a
  // spanning hierarchy instead of repeatedly increasing ranks around a cycle.
  const processed = new Set(queue);
  for (const node of nodes) {
    if (processed.has(node.id)) continue;
    const pending = [node.id];
    ranks.set(node.id, ranks.get(node.id) ?? 0);
    processed.add(node.id);
    for (let index = 0; index < pending.length; index++) {
      const id = pending[index];
      for (const child of children.get(id)!) {
        if (processed.has(child)) continue;
        processed.add(child);
        ranks.set(child, ranks.get(id)! + 1);
        pending.push(child);
      }
    }
  }

  const rows = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const rank = ranks.get(node.id) ?? 0;
    rows.set(rank, [...(rows.get(rank) ?? []), node]);
  }
  const centers = new Map<string, number>();
  const result: LayoutNode[] = [];
  let y = 0;
  for (const [, row] of [...rows].sort(([a], [b]) => a - b)) {
    const parentCenter = (node: GraphNode) => {
      const values = [...parents.get(node.id)!].flatMap((id) => centers.has(id) ? [centers.get(id)!] : []);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    };
    row.sort((a, b) => {
      const aPrimaryTime = primaryTimelineTime(a);
      const bPrimaryTime = primaryTimelineTime(b);
      if (aPrimaryTime !== null && bPrimaryTime !== null && aPrimaryTime !== bPrimaryTime) {
        return aPrimaryTime - bPrimaryTime;
      }
      return parentCenter(a) - parentCenter(b) || a.id.localeCompare(b.id);
    });
    const sized = row.map((node) => ({ node, width: dimensions.get(node.id)?.width ?? NODE_WIDTH, height: dimensions.get(node.id)?.height ?? estimateHeight(node) }));
    const gap = Math.max(GRAPH_SPACING.horizontalGap, GRAPH_SPACING.siblingGap);
    const totalWidth = sized.reduce((sum, node) => sum + node.width, 0) + Math.max(0, row.length - 1) * gap;
    let x = -totalWidth / 2;
    for (const { node, width, height } of sized) {
      result.push({ id: node.id, type: node.type, x, y, width, height });
      centers.set(node.id, x + width / 2);
      x += width + gap;
    }
    y += Math.max(...sized.map((node) => node.height)) + GRAPH_SPACING.rankGap;
  }
  return result;
}

function primaryTimelineTime(node: GraphNode) {
  if (node.type !== "timeline_event" || node.metadata?.eventRole === "supporting") return null;
  const value = node.metadata?.eventTime;
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function placeNewNodes(layout: LayoutNode[], existing: LayoutNode[]): LayoutNode[] {
  const byId = new Map(existing.map((node) => [node.id, node]));
  const occupied = existing.filter((node) => layout.some((next) => next.id === node.id));
  return layout.map((node) => {
    const saved = byId.get(node.id);
    if (saved) return { ...node, x: saved.x, y: saved.y };
    let candidate = { ...node };
    let collision: LayoutNode | undefined;
    while ((collision = occupied.find((other) =>
      candidate.x < other.x + other.width + GRAPH_SPACING.siblingGap &&
      candidate.x + candidate.width + GRAPH_SPACING.siblingGap > other.x &&
      candidate.y < other.y + other.height + GRAPH_SPACING.rankGap &&
      candidate.y + candidate.height + GRAPH_SPACING.rankGap > other.y))) {
      candidate = { ...candidate, x: collision.x + collision.width + GRAPH_SPACING.horizontalGap };
    }
    occupied.push(candidate);
    return candidate;
  });
}

const FOCUS_COLUMNS = { findings: 5, related: 4 };

// Findings form a wrapped grid; everything revealed by a focused finding sits in
// wrapped rows below it, centred under that finding. Sizes drive positions, so nothing overlaps.
export function layoutFocused(nodes: GraphNode[], edges: GraphEdge[], focusedId: string | null, dimensions: NodeDimensions = new Map()): LayoutNode[] {
  const size = (node: GraphNode) => ({ width: dimensions.get(node.id)?.width ?? NODE_WIDTH, height: dimensions.get(node.id)?.height ?? estimateHeight(node) });
  const gap = GRAPH_SPACING.horizontalGap;
  const result: LayoutNode[] = [];
  const place = (group: GraphNode[], columns: number, startY: number, centerOn?: number) => {
    let y = startY;
    const placed: LayoutNode[] = [];
    for (let i = 0; i < group.length; i += columns) {
      const row = group.slice(i, i + columns).map((node) => ({ node, ...size(node) }));
      const rowWidth = row.reduce((sum, item) => sum + item.width, 0) + (row.length - 1) * gap;
      let x = (centerOn ?? 0) - rowWidth / 2;
      for (const { node, width, height } of row) {
        placed.push({ id: node.id, type: node.type, x, y, width, height });
        x += width + gap;
      }
      y += Math.max(...row.map((item) => item.height)) + GRAPH_SPACING.rankGap;
    }
    result.push(...placed);
    return { placed, bottom: y };
  };

  const findings = nodes.filter((node) => node.type === "finding");
  const { placed, bottom } = place(findings, FOCUS_COLUMNS.findings, 0);
  const focused = placed.find((node) => node.id === focusedId);
  const direct = new Set(edges.flatMap((edge) => edge.source === focusedId ? [edge.target] : edge.target === focusedId ? [edge.source] : []));
  const related = nodes.filter((node) => node.type !== "finding")
    .sort((a, b) => Number(direct.has(b.id)) - Number(direct.has(a.id)) || (primaryTimelineTime(a) ?? 0) - (primaryTimelineTime(b) ?? 0) || a.id.localeCompare(b.id));
  const center = focused ? focused.x + focused.width / 2 : 0;
  place(related, FOCUS_COLUMNS.related, bottom, center);
  return result;
}
