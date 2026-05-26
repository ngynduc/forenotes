import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EntityNode } from "./nodes/EntityNode";
import { LabeledEdge } from "./edges/LabeledEdge";
import { layoutNodes } from "./layout";
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
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);

  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const layout = layoutNodes(data.nodes);

    const nodes: EntityFlowNode[] = layout.map((ln) => {
      const gn = data.nodes.find((n) => n.id === ln.id)!;
      return {
        id: ln.id,
        type: "entity",
        position: { x: ln.x, y: ln.y },
        style: { width: ln.width, minHeight: ln.height },
        data: { ...gn, label: gn.label },
      };
    });

    const edges: LabeledFlowEdge[] = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "labeled",
      data: { label: e.label },
      animated: e.derived,
    }));

    return { nodes, edges };
  }, [data]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<EntityFlowNode>(baseNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<LabeledFlowEdge>(baseEdges);

  useEffect(() => {
    setFlowNodes((currentNodes) => {
      const positionById = new Map(currentNodes.map((node) => [node.id, node.position]));

      return baseNodes.map((node) => ({
        ...node,
        position: positionById.get(node.id) ?? node.position,
      }));
    });
  }, [baseNodes, setFlowNodes]);

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
