import { useMemo, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  type ReactFlowInstance,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EntityNode } from "./nodes/EntityNode";
import { LabeledEdge } from "./edges/LabeledEdge";
import { Button } from "@/components/ui/Button";
import { layoutNodes, placeNewNodes } from "./layout";
import { useGraph } from "@/hooks/use-graph";
import { useGraphStore } from "@/stores/graph-store";
import { NodeInspector } from "./NodeInspector";
import type { GraphNode } from "@shared/graph-types";

const nodeTypes = { entity: EntityNode };
const edgeTypes = { labeled: LabeledEdge };

type EntityFlowNodeData = GraphNode & Record<string, unknown> & {
  label: string;
  isSelected?: boolean;
  isConnected?: boolean;
  isDimmed?: boolean;
};

type LabeledEdgeData = Record<string, unknown> & {
  label: string;
  isConnected?: boolean;
  isDimmed?: boolean;
};

type EntityFlowNode = Node<EntityFlowNodeData>;
type LabeledFlowEdge = Edge<LabeledEdgeData>;

export function RelationshipGraph() {
  const { data, isLoading } = useGraph();
  const scopeRef = useRef("");
  const measuredLayoutDone = useRef(false);
  const flowRef = useRef<ReactFlowInstance<EntityFlowNode, LabeledFlowEdge> | null>(null);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);

  useEffect(() => {
    if (data && selectedNodeId && !data.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNode(null);
    }
  }, [data, selectedNodeId, setSelectedNode]);

  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const layout = layoutNodes(data.nodes, data.edges);

    const graphNodes = new Map(data.nodes.map((node) => [node.id, node]));
    const nodes: EntityFlowNode[] = layout.map((ln) => {
      const gn = graphNodes.get(ln.id)!;
      return {
        id: ln.id,
        type: "entity",
        position: { x: ln.x, y: ln.y },
        style: { width: ln.width, minHeight: 84 },
        data: { ...gn, label: gn.label },
      };
    });

    const edges: LabeledFlowEdge[] = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "labeled",
      data: { ...e, label: e.label },
      animated: e.derived,
    }));

    return { nodes, edges };
  }, [data]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<EntityFlowNode>(baseNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<LabeledFlowEdge>(baseEdges);

  useEffect(() => {
    // Query-key changes briefly have no data; retain positions through that
    // loading interval and reset only when a different incident/mode arrives.
    if (!data) return;
    const scope = `${data.incidentId}:${data.mode}`;
    const sameScope = scope === scopeRef.current;
    if (!sameScope) measuredLayoutDone.current = false;
    scopeRef.current = scope;
    setFlowNodes((currentNodes) => {
      const current = sameScope ? currentNodes : [];
      const currentById = new Map(current.map((node) => [node.id, node]));
      const toLayoutNode = (node: EntityFlowNode) => ({
        id: node.id, type: node.data.type, ...node.position,
        width: node.measured?.width ?? 240,
        height: node.measured?.height ?? 84,
      });
      const placements = placeNewNodes(
        data ? layoutNodes(data.nodes, data.edges) : [], current.map(toLayoutNode)
      );
      const positions = new Map(placements.map((node) => [node.id, { x: node.x, y: node.y }]));
      return baseNodes.map((node) => ({
        ...node,
        measured: currentById.get(node.id)?.measured,
        position: positions.get(node.id) ?? node.position,
      }));
    });
  }, [baseNodes, data, setFlowNodes]);

  const applyLayout = useCallback(() => {
    if (!data) return;
    const dimensions = new Map(flowNodes.flatMap((node) => node.measured?.width && node.measured?.height
      ? [[node.id, { width: node.measured.width, height: node.measured.height }] as const] : []));
    const positions = new Map(layoutNodes(data.nodes, data.edges, dimensions).map((node) => [node.id, { x: node.x, y: node.y }]));
    measuredLayoutDone.current = true;
    setFlowNodes((current) => current.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })));
    requestAnimationFrame(() => void flowRef.current?.fitView({ padding: 0.2 }));
  }, [data, flowNodes, setFlowNodes]);

  useEffect(() => {
    const ids = new Set(data?.nodes.map((node) => node.id));
    if (!measuredLayoutDone.current && flowNodes.length && flowNodes.length === ids.size &&
        flowNodes.every((node) => ids.has(node.id) && node.measured?.width && node.measured?.height)) {
      applyLayout();
    }
  }, [data, flowNodes, applyLayout]);

  useEffect(() => {
    setFlowEdges(baseEdges);
  }, [baseEdges, setFlowEdges]);

  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();

    if (!selectedNodeId) {
      return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };
    }

    baseEdges.forEach((edge) => {
      if (edge.source !== selectedNodeId && edge.target !== selectedNodeId) {
        return;
      }

      edgeIds.add(edge.id);
      if (edge.source !== selectedNodeId) nodeIds.add(edge.source);
      if (edge.target !== selectedNodeId) nodeIds.add(edge.target);
    });

    return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };
  }, [baseEdges, selectedNodeId]);

  useEffect(() => {
    const hasSelection = Boolean(selectedNodeId);

    setFlowNodes((currentNodes) =>
      currentNodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
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

    setFlowEdges((currentEdges) =>
      currentEdges.map((edge) => {
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
  }, [connectedEdgeIds, connectedNodeIds, selectedNodeId, setFlowEdges, setFlowNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: EntityFlowNode) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: EntityFlowNode) => {
      measuredLayoutDone.current = true;
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading graph...</p>;
  }

  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1">
        <div className="h-[calc(100vh-200px)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <ReactFlow<EntityFlowNode, LabeledFlowEdge>
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(instance) => { flowRef.current = instance; }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onPaneClick={onPaneClick}
            fitView
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable
          >
            <Panel position="top-left">
              <Button size="sm" variant="outline" onClick={applyLayout}>Auto layout</Button>
            </Panel>
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
      <NodeInspector />
    </div>
  );
}
