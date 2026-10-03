import { Position } from "@xyflow/react";

export interface NodeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Compare centers relative to the combined bounding boxes, so wide nodes do
// not choose a side based only on an arbitrary pixel-distance threshold.
export function edgeAttachment(source: NodeBox, target: NodeBox) {
  const dx = target.x + target.width / 2 - source.x - source.width / 2;
  const dy = target.y + target.height / 2 - source.y - source.height / 2;
  const horizontal = Math.abs(dx) / Math.max(1, (source.width + target.width) / 2);
  const vertical = Math.abs(dy) / Math.max(1, (source.height + target.height) / 2);
  if (horizontal > vertical) {
    const right = dx >= 0;
    return {
      sourceX: source.x + (right ? source.width : 0), sourceY: source.y + source.height / 2,
      targetX: target.x + (right ? 0 : target.width), targetY: target.y + target.height / 2,
      sourcePosition: right ? Position.Right : Position.Left,
      targetPosition: right ? Position.Left : Position.Right,
    };
  }
  const below = dy >= 0;
  return {
    sourceX: source.x + source.width / 2, sourceY: source.y + (below ? source.height : 0),
    targetX: target.x + target.width / 2, targetY: target.y + (below ? 0 : target.height),
    sourcePosition: below ? Position.Bottom : Position.Top,
    targetPosition: below ? Position.Top : Position.Bottom,
  };
}
