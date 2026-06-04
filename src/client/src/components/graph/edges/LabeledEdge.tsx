import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = (data ?? {}) as {
    label?: string;
    isConnected?: boolean;
    isDimmed?: boolean;
  };
  const label = edgeData.label || "";
  const isConnected = Boolean(edgeData.isConnected);
  const isDimmed = Boolean(edgeData.isDimmed);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected || isConnected ? "var(--color-primary)" : "var(--color-border-strong)",
          strokeWidth: selected || isConnected ? 2.5 : 1,
          strokeOpacity: isDimmed ? 0.2 : 1,
          transition: "stroke 150ms ease, stroke-width 150ms ease, stroke-opacity 150ms ease",
        }}
      />
      {label && (selected || isConnected) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="rounded bg-[var(--color-surface)] border border-[var(--color-border)] px-1 py-0.5 text-[10px] text-[var(--color-text-muted)]"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
