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
