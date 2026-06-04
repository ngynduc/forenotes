import { useMemo, useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Position,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DemoEntityNode } from "./DemoEntityNode";
import { DemoLabeledEdge } from "./DemoLabeledEdge";
import { DEMO_NODES, DEMO_EDGES } from "./demoData";

const nodeTypes = { entity: DemoEntityNode };
const edgeTypes = { labeled: DemoLabeledEdge };

// Fixed positions — no layout algorithm, hand-placed for readability
const POSITIONS: Record<string, { x: number; y: number }> = {
  "case-1":  { x: 0,     y: 0 },
  "inc-1":   { x: -300,  y: 160 },
  "inc-2":   { x: 300,   y: 160 },
  "find-1":  { x: -450,  y: 340 },
  "find-2":  { x: -150,  y: 340 },
  "find-3":  { x: 300,   y: 340 },
  "ind-1":   { x: -600,  y: 520 },
  "sys-1":   { x: -300,  y: 520 },
  "acc-1":   { x: -30,   y: 520 },
  "mitre-1": { x: -600,  y: 680 },
  "mitre-2": { x: -300,  y: 680 },
  "tl-1":    { x: 260,   y: 520 },
  "tl-2":    { x: 520,   y: 520 },
};

interface FlowNodeData extends Record<string, unknown> {
  label: string;
  entityType: string;
  subtitle?: string;
  severity?: string;
  status?: string;
  isSelected?: boolean;
  isConnected?: boolean;
  isDimmed?: boolean;
}

interface FlowEdgeData extends Record<string, unknown> {
  label: string;
  isConnected?: boolean;
  isDimmed?: boolean;
}

type FlowNode = Node<FlowNodeData>;
type FlowEdge = Edge<FlowEdgeData>;

const AUTO_CYCLE_MS = 3500;
const AUTO_PATHS = [
  ["case-1", "inc-1", "find-1", "ind-1"],
  ["case-1", "inc-1", "find-2", "acc-1"],
  ["find-1", "mitre-1"],
  ["inc-1", "tl-1"],
  ["case-1", "inc-2", "find-3"],
];

function GraphInner() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [autoActive, setAutoActive] = useState(true);
  const [autoPathIndex, setAutoPathIndex] = useState(0);
  const [autoNodeIndex, setAutoNodeIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    const nodes: FlowNode[] = DEMO_NODES.map((gn) => ({
      id: gn.id,
      type: "entity",
      position: POSITIONS[gn.id] ?? { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        label: gn.label,
        entityType: gn.type,
        subtitle: gn.subtitle,
        severity: gn.severity,
        status: gn.status,
      },
    }));
    const edges: FlowEdge[] = DEMO_EDGES.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "labeled",
      data: { label: e.label },
      animated: e.derived,
    }));
    return { nodes, edges };
  }, []);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>(baseNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<FlowEdge>(baseEdges);

  const activeNodeId = selectedNodeId ?? (autoActive ? AUTO_PATHS[autoPathIndex]?.[autoNodeIndex] ?? null : null);

  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    if (!activeNodeId) return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };

    baseEdges.forEach((edge) => {
      if (edge.source !== activeNodeId && edge.target !== activeNodeId) return;
      edgeIds.add(edge.id);
      if (edge.source !== activeNodeId) nodeIds.add(edge.source);
      if (edge.target !== activeNodeId) nodeIds.add(edge.target);
    });
    return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };
  }, [baseEdges, activeNodeId]);

  useEffect(() => {
    const hasSelection = Boolean(activeNodeId);
    setFlowNodes((current) =>
      current.map((node) => {
        const isSelected = node.id === activeNodeId;
        const isConnected = connectedNodeIds.has(node.id);
        return {
          ...node,
          selected: isSelected,
          data: {
            ...node.data,
            isSelected,
            isConnected,
            isDimmed: hasSelection && !isSelected && !isConnected,
          },
        };
      })
    );
    setFlowEdges((current) =>
      current.map((edge) => {
        const isConnected = connectedEdgeIds.has(edge.id);
        return {
          ...edge,
          data: {
            ...(edge.data ?? {}),
            label: edge.data?.label ?? "",
            isConnected,
            isDimmed: hasSelection && !isConnected,
          },
        };
      })
    );
  }, [connectedEdgeIds, connectedNodeIds, activeNodeId, setFlowEdges, setFlowNodes]);

  useEffect(() => {
    if (!autoActive || selectedNodeId) return;
    const timer = setInterval(() => {
      setAutoNodeIndex((prev) => {
        const path = AUTO_PATHS[autoPathIndex];
        if (prev + 1 >= (path?.length ?? 0)) {
          setAutoPathIndex((pi) => (pi + 1) % AUTO_PATHS.length);
          return 0;
        }
        return prev + 1;
      });
    }, AUTO_CYCLE_MS);
    return () => clearInterval(timer);
  }, [autoActive, selectedNodeId, autoPathIndex]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
    setAutoActive(false);
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setAutoActive(true);
    setAutoPathIndex(0);
    setAutoNodeIndex(0);
  }, []);

  const selectedDetail = useMemo(() => {
    if (!selectedNodeId) return null;
    return DEMO_NODES.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId]);

  return (
    <div className="relative">
      <div className="h-[420px] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm sm:h-[560px] lg:h-[680px]">
        <ReactFlow<FlowNode, FlowEdge>
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: isMobile ? 0.18 : 0.04 }}
          minZoom={isMobile ? 0.4 : 0.65}
          maxZoom={isMobile ? 1.15 : 1.35}
          zoomOnScroll={false}
          zoomOnPinch={isMobile}
          zoomOnDoubleClick={false}
          panOnDrag={isMobile}
          panOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          defaultEdgeOptions={{ style: { strokeWidth: 1.5 } }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(45,212,191,0.04)" gap={30} />
        </ReactFlow>
      </div>

      {selectedDetail && (
        <div className="absolute inset-x-3 bottom-3 top-auto max-w-none rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,14,0.92)] p-4 backdrop-blur-xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-w-[240px]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[0.8125rem] font-semibold text-[#e8efec]">{selectedDetail.label}</p>
            <button
              onClick={onPaneClick}
              className="shrink-0 text-[#5c756d] transition-colors hover:text-[#e8efec]"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>
          {selectedDetail.subtitle && (
            <p className="mt-1 text-[0.6875rem] text-[#8fa9a1]">{selectedDetail.subtitle}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedDetail.severity && (
              <span
                className="rounded-[4px] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                style={{
                  color: selectedDetail.severity === "critical" ? "#f87171"
                    : selectedDetail.severity === "high" ? "#fb923c"
                    : selectedDetail.severity === "medium" ? "#fbbf24"
                    : "#2dd4bf",
                  background: selectedDetail.severity === "critical" ? "rgba(248,113,113,0.12)"
                    : selectedDetail.severity === "high" ? "rgba(251,146,60,0.12)"
                    : selectedDetail.severity === "medium" ? "rgba(251,191,36,0.12)"
                    : "rgba(45,212,191,0.12)",
                }}
              >
                {selectedDetail.severity}
              </span>
            )}
            {selectedDetail.status && (
              <span className="rounded-[4px] bg-[rgba(45,212,191,0.1)] px-2 py-0.5 text-[9px] font-semibold text-[#2dd4bf]">
                {selectedDetail.status}
              </span>
            )}
          </div>
          <p className="mt-2 text-[0.6875rem] capitalize text-[#5c756d]">{selectedDetail.type.replace(/_/g, " ")}</p>
        </div>
      )}

    </div>
  );
}

export function DemoGraph() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  );
}
