import type { GraphResponse } from "@shared/graph-types";

export function filterAssignmentEdges(graph: GraphResponse, includeAssignments: boolean): GraphResponse {
  if (includeAssignments) return graph;

  const edges = graph.edges.filter((edge) => edge.type !== "assigned_to");
  const connectedIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const nodes = graph.nodes.filter((node) => node.type !== "user" || connectedIds.has(node.id));
  const derivedLinks = edges.filter((edge) => edge.derived).length;

  return {
    ...graph,
    nodes,
    edges,
    stats: {
      ...graph.stats,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      derivedLinks,
      manualLinks: edges.length - derivedLinks,
    },
  };
}

export function filterSupportingTimelineEvents(graph: GraphResponse, expandedPrimaryEventIds: ReadonlySet<string>): GraphResponse {
  const visibleNodes = graph.nodes.filter((node) => {
    if (node.type !== "timeline_event") return true;
    const eventRole = node.metadata?.eventRole ?? "primary";
    if (eventRole !== "supporting") return true;
    const primaryEventId = node.metadata?.primaryEventId;
    return typeof primaryEventId === "string" && expandedPrimaryEventIds.has(primaryEventId);
  });
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  return {
    ...graph,
    nodes: visibleNodes,
    edges: visibleEdges,
    stats: { ...graph.stats, totalNodes: visibleNodes.length, totalEdges: visibleEdges.length },
  };
}

// Only findings are shown until one is focused; then its direct neighbours (and expanded supporting events) appear too.
export function filterToFocusedFinding(
  graph: GraphResponse,
  focusedFindingId: string | null,
  expandedPrimaryEventIds: ReadonlySet<string> = new Set()
): GraphResponse {
  const neighbourIds = new Set<string>();
  if (focusedFindingId) {
    for (const edge of graph.edges) {
      if (edge.source === focusedFindingId) neighbourIds.add(edge.target);
      else if (edge.target === focusedFindingId) neighbourIds.add(edge.source);
    }
  }
  const nodes = graph.nodes.filter((node) => {
    if (node.type === "finding" || node.id === focusedFindingId || neighbourIds.has(node.id)) return true;
    const primaryEventId = node.metadata?.primaryEventId;
    return focusedFindingId !== null && typeof primaryEventId === "string" && expandedPrimaryEventIds.has(primaryEventId);
  });
  const visibleIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  return { ...graph, nodes, edges, stats: { ...graph.stats, totalNodes: nodes.length, totalEdges: edges.length } };
}
