import type { GraphNode } from "@shared/graph-types";

interface LayoutNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const LANE_ORDER: Record<string, number> = {
  case: 0,
  incident: 1,
  finding: 2,
  task: 3,
  query: 4,
  indicator: 5,
  system: 6,
  account: 7,
  timeline_event: 8,
  mitre_tactic: 9,
  mitre_technique: 10,
};

const LANE_HEIGHT = 140;
const NODE_WIDTH = 240;
const NODE_HEIGHT = 84;
const LANE_GAP = 36;
const NODE_GAP = 88;

export function layoutNodes(nodes: GraphNode[]): LayoutNode[] {
  const lanes = new Map<number, GraphNode[]>();

  for (const node of nodes) {
    const lane = LANE_ORDER[node.type] ?? 5;
    if (!lanes.has(lane)) lanes.set(lane, []);
    lanes.get(lane)!.push(node);
  }

  const sortedLanes = [...lanes.entries()].sort((a, b) => a[0] - b[0]);
  const result: LayoutNode[] = [];

  sortedLanes.forEach(([, laneNodes], laneIndex) => {
    const y = laneIndex * (LANE_HEIGHT + LANE_GAP);
    const totalWidth = laneNodes.length * NODE_WIDTH + Math.max(0, laneNodes.length - 1) * NODE_GAP;
    const startX = -totalWidth / 2;

    laneNodes.forEach((node, nodeIndex) => {
      result.push({
        id: node.id,
        type: node.type,
        x: startX + nodeIndex * (NODE_WIDTH + NODE_GAP),
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });
  });

  return result;
}
