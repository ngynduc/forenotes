import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";

export function DemoLabeledEdge({
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
  const isConnected = Boolean(edgeData.isConnected);
  const isDimmed = Boolean(edgeData.isDimmed);
  const showLabel = selected || isConnected;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: showLabel ? "#2dd4bf" : "rgba(45,212,191,0.55)",
          strokeWidth: showLabel ? 2.5 : 1.75,
          strokeOpacity: isDimmed ? 0.42 : 1,
          transition: "stroke 300ms ease, stroke-width 300ms ease, stroke-opacity 300ms ease",
        }}
      />
      {edgeData.label && showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
            }}
            className="whitespace-nowrap rounded-md border border-[rgba(45,212,191,0.2)] bg-[rgba(10,15,14,0.95)] px-2 py-1 text-[10px] font-medium text-[#2dd4bf] backdrop-blur-sm"
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
